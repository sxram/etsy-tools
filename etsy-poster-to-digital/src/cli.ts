import { config } from "./config.js";
import { authenticate } from "./auth.js";
import { createDigitalDraft, getAllShopListings, getListing, getListingImages, getMyShop, getMyUserId, uploadDigitalFile } from "./etsy.js";
import { isLikelyPhysicalPoster } from "./posters.js";
import { exportListings, printListings } from "./output.js";
import { chooseBestGroup, scanDigitalFileGroups } from "./digital-files.js";
import { makeDigitalDescription, makeDigitalTitle } from "./digital-listing.js";

function arg(name:string){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
function requiredArg(name:string){const v=arg(name);if(!v)throw new Error(`Missing argument ${name}`);return v;}
function directoryArg(){return arg("--dir")||config.digitalFilesDir;}
function printGroup(group:{displayName:string;files:string[]}){console.log(`\n✓ ${group.displayName}`);for(const f of group.files)console.log(`  - ${f.split(/[\\/]/).pop()}`);}

async function resolveSourceAndGroup(){
  const listingId=Number(requiredArg("--listing")); if(!Number.isFinite(listingId))throw new Error("--listing must be a numeric Etsy listing ID.");
  const dir=directoryArg(); const source=await getListing(listingId); const groups=await scanDigitalFileGroups(dir); const explicitGroup=arg("--group"); let selected;
  if(explicitGroup){selected=groups.find(g=>g.displayName.toLowerCase()===explicitGroup.toLowerCase()); if(!selected)throw new Error(`No exact group named "${explicitGroup}" found in ${dir}`);}
  else{const best=chooseBestGroup(groups,source.title); if(best.score<0.35||best.score-best.secondScore<0.08){console.error(`\nCould not safely auto-match files to:\n  ${source.title}\n`);console.error("Available groups:");for(const g of groups)printGroup(g);throw new Error(`Ambiguous file match. Re-run with --group "EXACT GROUP NAME".`);}selected=best.group;}
  return {source,group:selected};
}

async function main(){
  const cmd=process.argv[2];
  if(cmd==="auth"){await authenticate();return;}
  if(cmd==="whoami"){const userId=await getMyUserId();const shop=await getMyShop();console.log({userId,shopId:shop.shop_id,shopName:shop.shop_name,activeListings:shop.listing_active_count,digitalListings:shop.digital_listing_count});return;}
  if(cmd==="digital:scan"){const dir=directoryArg();const groups=await scanDigitalFileGroups(dir);console.log(`\nDigital product groups found in ${dir}:`);for(const g of groups)printGroup(g);console.log(`\n${groups.length} product group(s).`);return;}
  if(cmd==="digital:preview"){const {source,group}=await resolveSourceAndGroup();console.log("\nSOURCE ETSY LISTING");console.log(`ID:    ${source.listing_id}`);console.log(`Title: ${source.title}`);console.log("\nMATCHED DIGITAL FILES");printGroup(group);console.log("\nNEW DRAFT TITLE");console.log(makeDigitalTitle(source.title));console.log("\nPRICE");console.log(`${config.digitalPrice.toFixed(2)} (shop currency)`);console.log("\nNothing has been written to Etsy.");return;}
  if(cmd==="digital:create"){
    const {source,group}=await resolveSourceAndGroup();const shop=await getMyShop();console.log("\nAbout to create ONE Etsy digital draft:");console.log(`Source: ${source.listing_id} — ${source.title}`);printGroup(group);
    const images=source.images?.length?source.images:await getListingImages(shop.shop_id,source.listing_id);const imageIds=images.sort((a,b)=>(a.rank??999)-(b.rank??999)).map(x=>x.listing_image_id);
    const draft=await createDigitalDraft({shopId:shop.shop_id,source,imageIds,title:makeDigitalTitle(source.title),description:makeDigitalDescription(source,group),price:config.digitalPrice});console.log(`\nDraft created: ${draft.listing_id}`);
    try{for(const file of group.files){console.log(`Uploading ${file.split(/[\\/]/).pop()} ...`);await uploadDigitalFile(shop.shop_id,draft.listing_id,file);}}
    catch(error){console.error(`\nThe Etsy draft ${draft.listing_id} was created, but at least one file upload failed.`);console.error("The draft was NOT published. Fix the problem and inspect/delete the draft in Etsy.");throw error;}
    console.log("\nSUCCESS");console.log(`Digital Etsy draft: ${draft.listing_id}`);console.log(`${group.files.length} file(s) uploaded.`);console.log("The listing remains a DRAFT and was NOT published.");return;
  }
  const shop=await getMyShop();const listings=await getAllShopListings(shop.shop_id,"active");
  if(cmd==="list"){printListings(listings);await exportListings("active-listings",listings);return;}
  if(cmd==="posters"){const posters=listings.filter(isLikelyPhysicalPoster);printListings(posters);await exportListings("physical-posters",posters);return;}
  console.log(`\nUsage:\n  npm run auth\n  npm run whoami\n  npm run list\n  npm run posters\n  npm run digital:scan -- --dir ./digital\n  npm run digital:preview -- --listing 1234567890 --dir ./digital\n  npm run digital:create -- --listing 1234567890 --dir ./digital\n\nIf matching is ambiguous:\n  npm run digital:preview -- --listing 1234567890 --dir ./digital --group "Yellow Alien Space Poster_Pip_Comet"\n`);
}
main().catch(err=>{console.error("\nERROR:",err instanceof Error?err.message:err);process.exit(1);});
