export type EtsyToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  obtained_at: number;
};

export type EtsyMoney = {
  amount: number;
  divisor: number;
  currency_code: string;
};

export type EtsyListingImage = {
  listing_image_id: number;
  rank?: number;
  url_fullxfull?: string;
};

export type EtsyListing = {
  listing_id: number;
  shop_id: number;
  title: string;
  description?: string;
  state: string;
  quantity?: number;
  url?: string;
  num_favorers?: number;
  listing_type?: string;
  type?: string;
  tags?: string[];
  price?: EtsyMoney;
  taxonomy_id?: number;
  shop_section_id?: number | null;
  shipping_profile_id?: number | null;
  who_made?: string;
  when_made?: string;
  images?: EtsyListingImage[];
};

export type EtsyShop = {
  shop_id: number;
  user_id: number;
  shop_name: string;
  listing_active_count?: number;
  digital_listing_count?: number;
};

export type DigitalFileGroup = {
  key: string;
  displayName: string;
  files: string[];
};
