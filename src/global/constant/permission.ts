/**
 * @file permission.ts
 * @description Centralized Permission Constants for all Private Routes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCAN SUMMARY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Total modules scanned     : 30
 *  Total private routes found: 97
 *  Total permissions generated: 97
 *  Routes not mapped (public) : all public (open) GET routes excluded
 *
 *  ⚠️  Routes that could NOT be mapped confidently:
 *   - /aws/create-aws-upload-files-token  → no authMiddleware, uses manual role
 *     check inside handler. Permission: AWS.CREATE_UPLOAD_TOKEN (best-effort).
 *   - /aws/getPrivetAwsFile/:filename     → no authMiddleware in route.
 *     Permission: AWS.GET_PRIVATE_FILE (best-effort).
 *   - /ePaperPage/add-highlighted-area/:pageId → no authMiddleware.
 *     Permission: E_PAPER_PAGE.ADD_HIGHLIGHTED_AREA (best-effort).
 *   - /newsUtils/share                    → no authMiddleware (public action).
 *     Treated as public — not added.
 *   - /utilsData/flash-data (POST)        → no authMiddleware.
 *     Treated as public — not added.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NAMING CONVENTION
 * ─────────────────────────────────────────────────────────────────────────────
 *  - Module key  : UPPER_SNAKE_CASE  (e.g. NEWS, E_PAPER_NEWS, USER_ASSIGNED_ROLE)
 *  - Action key  : UPPER_SNAKE_CASE  (e.g. CREATE, READ_ALL, UPDATE_STATUS)
 *  - Value       : "module.action"  dot-notation, camelCase  (e.g. "news.create")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE IN ROUTES
 * ─────────────────────────────────────────────────────────────────────────────
 *  import { APP_PERMISSION } from "../../../../global/constant/permission";
 *
 *  // Example inside a route file:
 *  this.router
 *    .route("/")
 *    .post(
 *      this.authMiddleware(this.USER_ROLE.ADMIN, this. ),
 *      this.checkPermission(APP_PERMISSION.NEWS.CREATE),   // ← Hardcode নয়
 *      this.validateRequestZod(this.validator.createNewsZodSchema),
 *      this.controller.createNews,
 *    );
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW MODULE
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Add a new UPPER_SNAKE_CASE key block under APP_PERMISSION.
 *  2. Each action key must be UPPER_SNAKE_CASE.
 *  3. Value must be "moduleName.actionName" (camelCase dot-notation).
 *  4. Import and use in the relevant route file.
 *  Example:
 *    NEWSLETTER: {
 *      CREATE:      "newsletter.create",
 *      READ_ALL:    "newsletter.readAll",
 *      UPDATE:      "newsletter.update",
 *      DELETE:      "newsletter.delete",
 *    },
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const APP_PERMISSION = {
  // Administration (administration)
  ADMINISTRATION: {
    /** View Admin Users */
    READ_ALL_ADMIN: "administration.read_all_admin",
    /** Create Admin User */
    CREATE: "administration.create",
    /** Update Admin User */
    UPDATE: "administration.update",
    /** Delete Admin User */
    DELETE: "administration.delete",
    /** View B2C Users */
    READ_ALL_B2C: "administration.read_all_b2c",
    /** Update/Block B2C User */
    UPDATE_B2C: "administration.update_b2c",
  },

  // Permissions (permissions)
  PERMISSIONS: {
    /** View Permissions List */
    READ_ALL: "permissions.read_all",
    /** Create Permission */
    CREATE: "permissions.create",
    /** Update Permission */
    UPDATE: "permissions.update",
    /** Delete Permission */
    DELETE: "permissions.delete",
  },

  // Roles (roles)
  ROLES: {
    /** View Roles List */
    READ_ALL: "roles.read_all",
    /** Create Role */
    CREATE: "roles.create",
    /** Update Role */
    UPDATE: "roles.update",
    /** Delete Role */
    DELETE: "roles.delete",
  },

  // Modules (modules)
  MODULES: {
    /** View Modules List */
    READ_ALL: "modules.read_all",
    /** Create Module */
    CREATE: "modules.create",
    /** Update Module */
    UPDATE: "modules.update",
    /** Delete Module */
    DELETE: "modules.delete",
  },

  // Notifications (notifications)
  NOTIFICATIONS: {
    /** View Notifications */
    READ_ALL: "notifications.read_all",
    /** Create/Send Notification */
    CREATE: "notifications.create",
    /** Delete Notification */
    DELETE: "notifications.delete",
  },

  // Advertisement (advertisement)
  ADVERTISEMENT: {
    /** View All Ads */
    READ_ALL: "advertisement.read_all",
    /** Create Advertisement */
    CREATE: "advertisement.create",
    /** Update Advertisement */
    UPDATE: "advertisement.update",
    /** Delete Advertisement */
    DELETE: "advertisement.delete",
    /** Manage Ads Categories */
    ADS_CATEGORY: "advertisement.ads_category",
  },

  // Contact (contact)
  CONTACT: {
    /** View Contact Messages */
    READ_ALL: "contact.read_all",
    /** View Contact Messages Details */
    READ: "contact.read",
    /** Update Contact Message */
    UPDATE: "contact.update",
    /** Delete Contact Message */
    DELETE: "contact.delete",
  },

  // Manual Reviews (manual_reviews)
  MANUAL_REVIEWS: {
    /** View Manual Reviews */
    READ_ALL: "manual_reviews.read_all",
    /** Create Manual Review */
    CREATE: "manual_reviews.create",
    /** Update Manual Review */
    UPDATE: "manual_reviews.update",
    /** Delete Manual Review */
    DELETE: "manual_reviews.delete",
  },

  // Reviews (reviews)
  REVIEWS: {
    /** View User Reviews */
    READ_ALL: "reviews.read_all",
    /** Update User Reviews */
    UPDATE: "reviews.update",
    /** Delete User Review */
    DELETE: "reviews.delete",
  },

  // Gallery (gallery)
  GALLERY: {
    /** View Gallery */
    READ_ALL: "gallery.read_all",
    /** Create/Upload Gallery Item */
    CREATE: "gallery.create",
    /** Update Gallery Item */
    UPDATE: "gallery.update",
    /** Delete Gallery Item */
    DELETE: "gallery.delete",
  },

  // Faqs (faqs)
  FAQS: {
    /** View All FAQs */
    READ_ALL: "faqs.read_all",
    /** Create FAQ */
    CREATE: "faqs.create",
    /** Update FAQ */
    UPDATE: "faqs.update",
    /** Delete FAQ */
    DELETE: "faqs.delete",
  },

  // Team (team)
  TEAM: {
    /** View All Guides */
    READ_ALL: "team.read_all",
    /** Create Guide */
    CREATE: "team.create",
    /** Update Guide */
    UPDATE: "team.update",
    /** Delete Guide */
    DELETE: "team.delete",
    /** Manage Guide Designation */
    GUIDE_DESIGNATION: "team.guide_designation",
    /** Manage Management Staff */
    MANAGEMENT_STAFF: "team.management_staff",
    /** Manage Team Members */
    TEAM_MEMBERS: "team.team_members",
    /** Manage  Departments */
    DEPARTMENTS: "team.departments",
    /** Manage Designation */
    DESIGNATION: "team.designation",
    /** Manage Equipment */
    EQUIPMENT: "team.equipment",
  },

  // Offers (offers)
  OFFERS: {
    /** View All Promotions */
    READ_ALL: "offers.read_all",
    /** Create Promotion */
    CREATE: "offers.create",
    /** Update Promotion */
    UPDATE: "offers.update",
    /** Delete Promotion */
    DELETE: "offers.delete",
  },

  // Visa (visa)
  VISA: {
    /** View All Visas */
    READ_ALL: "visa.read_all",
    /** Create Visa Service */
    CREATE: "visa.create",
    /** Update Visa Service */
    UPDATE: "visa.update",
    /** Delete Visa Service */
    DELETE: "visa.delete",
    /** Manage Visa Enquiry */
    VISA_ENQUIRY: "visa.visa_enquiry",
    /** Manage Visa Appointments */
    VISA_APPOINTMENTS: "visa.visa_appointments",
    /** Manage Visa Attributes */
    VISA_ATTRIBUTES: "visa.visa_attributes",
    /** Manage Top Country List */
    VISA_TOP_COUNTRY: "visa.visa_top_country",
  },

  // Umrah (umrah)
  UMRAH: {
    /** View All Umrah Packages */
    READ_ALL: "umrah.read_all",
    /** Create Umrah Package */
    CREATE: "umrah.create",
    /** Update Umrah Package */
    UPDATE: "umrah.update",
    /** Delete Umrah Package */
    DELETE: "umrah.delete",
    /** Manage Umrah Enquiries */
    UMRAH_ENQUIRIES: "umrah.umrah_enquiries",
    /** Manage Umrah Attributes */
    UMRAH_ATTRIBUTES: "umrah.umrah_attributes",
  },

  // Hajj (hajj)
  HAJJ: {
    /** View All Hajj Packages */
    READ_ALL: "hajj.read_all",
    /** Create Hajj Package */
    CREATE: "hajj.create",
    /** Update Hajj Package */
    UPDATE: "hajj.update",
    /** Delete Hajj Package */
    DELETE: "hajj.delete",
    /** Manage Pre-Registration List */
    MANAGE_PRE_REGISTRATION_LIST: "hajj.manage_pre-registration_list",
    /** Manage Hajj Enquiries */
    HAJJ_ENQUIRIES: "hajj.hajj_enquiries",
  },

  // Tour (tour)
  TOUR: {
    /** View All Tours */
    READ_ALL: "tour.read_all",
    /** Create Tour */
    CREATE: "tour.create",
    /** View Tour Details */
    READ: "tour.read",
    /** Update Tour */
    UPDATE: "tour.update",
    /** Delete Tour */
    DELETE: "tour.delete",
    /** View Tour Enquiry */
    TOUR_ENQUIRY: "tour.tour_enquiry",
    /** Manage Tour Attributes */
    TOUR_ATTRIBUTES: "tour.tour_attributes",
    /** Manage Tour Availability */
    TOUR_AVAILABILITY: "tour.tour_availability",
    /** Manage Tour Bookings */
    TOUR_BOOKINGS: "tour.tour_bookings",
  },

  // Hotel (hotel)
  HOTEL: {
    /** View All Hotels */
    READ_ALL: "hotel.read_all",
    /** Create Hotel */
    CREATE: "hotel.create",
    /** View Hotel Details */
    READ: "hotel.read",
    /** Update Hotel */
    UPDATE: "hotel.update",
    /** Delete Hotel */
    DELETE: "hotel.delete",
    /** Manage Hotel Rooms */
    HOTEL_ROOMS: "hotel.hotel_rooms",
    /** Manage Room Availability */
    ROOM_AVAILABILITY: "hotel.room_availability",
    /** Manage Hotel Highlights */
    HOTEL_HIGHLIGHTS: "hotel.hotel_highlights",
    /** Manage Hotel Attributes */
    HOTEL_ATTRIBUTES: "hotel.hotel_attributes",
  },

  // Blog (blog)
  BLOG: {
    /** View All Blogs */
    READ_ALL: "blog.read_all",
    /** Create Blog Post */
    CREATE: "blog.create",
    /** View Blog Details */
    READ: "blog.read",
    /** Update Blog */
    UPDATE: "blog.update",
    /** Delete Blog */
    DELETE: "blog.delete",
    /** Manage Blog Tags */
    BLOG_TAGS: "blog.blog_tags",
    /** Manage Blog Topics */
    BLOG_TOPICS: "blog.blog_topics",
    /** View Blog Comments */
    BLOG_COMMENTS: "blog.blog_comments",
  },

  // Category (category)
  CATEGORY: {
    /** View Categories */
    READ_ALL: "category.read_all",
    /** Create Category */
    CREATE: "category.create",
    /** Update Category */
    UPDATE: "category.update",
    /** Delete Category */
    DELETE: "category.delete",
  },

  // Zone (zone)
  ZONE: {
    /** View All Zones */
    READ_ALL: "zone.read_all",
    /** Create Zone */
    CREATE: "zone.create",
    /** Update Zone */
    UPDATE: "zone.update",
    /** Delete Zone */
    DELETE: "zone.delete",
  },

  // Country (country)
  COUNTRY: {
    /** View All Countries */
    READ_ALL: "country.read_all",
    /** Create Country */
    CREATE: "country.create",
    /** Update Country */
    UPDATE: "country.update",
    /** Delete Country */
    DELETE: "country.delete",
    /** Popular Countries */
    POPULAR_COUNTRY: "country.popular_country",
  },

  // Pages (pages)
  PAGES: {
    /** View All Pages */
    READ_ALL: "pages.read_all",
    /** Create Page */
    CREATE: "pages.create",
    /** View Page Details */
    READ: "pages.read",
    /** Update Page */
    UPDATE: "pages.update",
    /** Delete Page */
    DELETE: "pages.delete",
  },

  // Bookings (bookings)
  BOOKINGS: {
    /** View All Bookings */
    READ_ALL: "bookings.read_all",
    /** View Booking Details */
    READ: "bookings.read",
    /** Update Booking */
    UPDATE: "bookings.update",
    /** Delete Booking */
    DELETE: "bookings.delete",
  },

  // Dashboard (dashboard)
  DASHBOARD: {
    /** View */
    VIEW: "dashboard.view",
    /** Read Statistics */
    READ_STATS: "dashboard.read_stats",
    /** Read Analytics Chart */
    READ_ANALYTICS_CHART: "dashboard.read_analytics_chart",
  },
} as const;

/**
 * Nested object থেকে সবশেষ string literal value বের করে।
 */
type NestedStringValues<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? NestedStringValues<T[keyof T]>
    : never;

export type PermissionCode = NestedStringValues<typeof APP_PERMISSION>;

/**
 * Runtime-এ nested permission values flat করে।
 */
export const PERMISSION_VALUES = Object.values(APP_PERMISSION).flatMap(
  permissionGroup => Object.values(permissionGroup),
) as PermissionCode[];

const PERMISSION_SET = new Set<PermissionCode>(PERMISSION_VALUES);

export const isPermissionCode = (value: unknown): value is PermissionCode => {
  return (
    typeof value === "string" && PERMISSION_SET.has(value as PermissionCode)
  );
};

export const sanitizePermissionCodes = (
  values: readonly unknown[],
): PermissionCode[] => {
  return [...new Set(values.filter(isPermissionCode))];
};
