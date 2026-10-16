/** Placeholder contact address (".example" is reserved and can't belong to anyone). Replace before launch. */
export const SUPPORT_EMAIL = "support@rommie.example";
export const LEGAL_UPDATED = "14 October 2026";
/**
 * Public contact details and social profiles shown in the footer.
 * EVERY value below is a placeholder. Replace with Rommie's real accounts before launch.
 * Set any value to "" to hide that item from the footer.
 */
export const CONTACT = {
    /** Digits only, with country code (used for wa.me links). */
    whatsappNumber: "254700000000",
    /** Shown to people, formatted for reading. */
    whatsappDisplay: "+254 700 000 000",
    phone: "+254700000000",
    phoneDisplay: "+254 700 000 000",
    hours: "Mon to Fri",
    location: "Karen, Nairobi County, Kenya",
};
export const SOCIALS = {
    instagram: "https://www.instagram.com/rommie.ke",
    tiktok: "https://www.tiktok.com/@rommie.ke",
    facebook: "https://www.facebook.com/rommie.ke",
    linkedin: "https://www.linkedin.com/company/rommie-ke",
    whatsapp: `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent("Hi Rommie, I need help with")}`,
};
