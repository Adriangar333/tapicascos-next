export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  active: boolean
}

export interface Service {
  id: string
  category_id: string
  name: string
  slug: string | null
  description: string | null
  long_description?: string | null
  price_min: number
  price_max: number | null
  image_url: string | null
  gallery_urls?: string[] | null
  sort_order: number
  active: boolean
  featured: boolean
  category?: Category
}

export interface GalleryItem {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
  active: boolean
}

export interface Testimonial {
  id: string
  name: string
  text: string
  rating: number
  active: boolean
}

export interface SiteConfig {
  id: string
  key: string
  value: string
  description: string | null
}

export interface Accessory {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  sort_order: number
}
