import "dotenv/config";
import {
  PrismaClient,
  Role,
  CampaignStatus,
  ApplicationStatus,
  CollaborationStatus,
  SubmissionStatus,
  PaymentStatus,
  MediaType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in dependency order
  await db.notification.deleteMany();
  await db.portfolioItem.deleteMany();
  await db.payment.deleteMany();
  await db.contentSubmission.deleteMany();
  await db.collaboration.deleteMany();
  await db.application.deleteMany();
  await db.campaign.deleteMany();
  await db.brand.deleteMany();
  await db.creator.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  const PASSWORD = await bcrypt.hash("demo1234", 12);

  // ─── Users ────────────────────────────────────────────────────
  const [bu1, bu2, bu3, cu1, cu2, cu3, cu4, cu5] = await Promise.all([
    db.user.create({ data: { email: "brand@demo.com",    name: "StyleHouse",      password: PASSWORD, role: Role.BRAND   } }),
    db.user.create({ data: { email: "brand2@demo.com",   name: "TechVibe",        password: PASSWORD, role: Role.BRAND   } }),
    db.user.create({ data: { email: "brand3@demo.com",   name: "GreenEarth",      password: PASSWORD, role: Role.BRAND   } }),
    db.user.create({ data: { email: "creator@demo.com",  name: "Ava Martinez",    password: PASSWORD, role: Role.CREATOR } }),
    db.user.create({ data: { email: "creator2@demo.com", name: "Jake Chen",       password: PASSWORD, role: Role.CREATOR } }),
    db.user.create({ data: { email: "creator3@demo.com", name: "Sofia Patel",     password: PASSWORD, role: Role.CREATOR } }),
    db.user.create({ data: { email: "creator4@demo.com", name: "Marcus Williams", password: PASSWORD, role: Role.CREATOR } }),
    db.user.create({ data: { email: "creator5@demo.com", name: "Emma Thompson",   password: PASSWORD, role: Role.CREATOR } }),
  ]);

  // ─── Brands ───────────────────────────────────────────────────
  const [brand1, brand2, brand3] = await Promise.all([
    db.brand.create({ data: { userId: bu1.id, companyName: "StyleHouse",  industry: "Fashion",        website: "https://stylehouse.com",  bio: "Premium brand specialising in sustainable streetwear and luxury basics." } }),
    db.brand.create({ data: { userId: bu2.id, companyName: "TechVibe",    industry: "Technology",     website: "https://techvibe.io",      bio: "Consumer tech accessories brand focused on minimalist design." } }),
    db.brand.create({ data: { userId: bu3.id, companyName: "GreenEarth",  industry: "Sustainability", website: "https://greenearth.co",    bio: "Eco-friendly home and lifestyle products committed to zero-waste living." } }),
  ]);

  // ─── Creators ─────────────────────────────────────────────────
  const [cr1, cr2, cr3, cr4, cr5] = await Promise.all([
    db.creator.create({ data: { userId: cu1.id, displayName: "Ava Martinez",    niche: "Fashion",        bio: "Sustainable style and everyday looks. 80 % female audience aged 22–35.",         instagramHandle: "@avamartinez",   tiktokHandle: "@avamartinez",        country: "United States" } }),
    db.creator.create({ data: { userId: cu2.id, displayName: "Jake Chen",       niche: "Technology",     bio: "Tech reviewer and gadget enthusiast. Honest reviews, no fluff.",                instagramHandle: "@jakechentech",   tiktokHandle: "@jakechentech",       country: "Canada"        } }),
    db.creator.create({ data: { userId: cu3.id, displayName: "Sofia Patel",     niche: "Lifestyle",      bio: "Wellness, travel, and mindful living. Known for zero-waste weekly challenges.",  instagramHandle: "@sofiapatel",     tiktokHandle: "@sofiapatel.life",    country: "United Kingdom" } }),
    db.creator.create({ data: { userId: cu4.id, displayName: "Marcus Williams", niche: "Fitness",        bio: "Fitness coach sharing workouts and healthy recipes.",                           instagramHandle: "@marcusfits",     tiktokHandle: "@marcusfits",         country: "Australia"     } }),
    db.creator.create({ data: { userId: cu5.id, displayName: "Emma Thompson",   niche: "Food",           bio: "Plant-based recipe developer. Zero-waste kitchen advocate.",                   instagramHandle: "@emmacooks",      tiktokHandle: "@emmacooks",          country: "United States" } }),
  ]);

  // ─── Campaigns ────────────────────────────────────────────────
  const [c1, c2, c3, c4, c5, c6, c7, c8] = await Promise.all([
    db.campaign.create({ data: { brandId: brand1.id, title: "Summer Collection 2025 Launch",      description: "Promote our sustainable summer fashion line. Authentic lifestyle content in natural settings.",          budget: 5000, niche: "Fashion",        status: CampaignStatus.ACTIVE  } }),
    db.campaign.create({ data: { brandId: brand1.id, title: "Back to School Streetwear",          description: "TikTok content featuring our back-to-school streetwear. Target: 16–24.",                               budget: 3000, niche: "Fashion",        status: CampaignStatus.ACTIVE  } }),
    db.campaign.create({ data: { brandId: brand1.id, title: "Holiday Gift Guide",                 description: "Holiday gift guide featuring our top 5 products. Reels + TikTok format.",                              budget: 2500, niche: "Fashion",        status: CampaignStatus.DRAFT   } }),
    db.campaign.create({ data: { brandId: brand2.id, title: "ProBuds X Earbuds Review",           description: "Honest review and unboxing of ProBuds X. Focus on sound quality and daily use.",                       budget: 4000, niche: "Technology",     status: CampaignStatus.ACTIVE  } }),
    db.campaign.create({ data: { brandId: brand2.id, title: "MagCharge Stand Launch",             description: "Showcase our magnetic wireless charging stand. Demo the fast-charge feature.",                         budget: 2000, niche: "Technology",     status: CampaignStatus.CLOSED  } }),
    db.campaign.create({ data: { brandId: brand3.id, title: "Zero Waste Kitchen Bundle",          description: "Show real-life usage of our zero-waste kitchen starter kit in everyday cooking.",                      budget: 1800, niche: "Sustainability", status: CampaignStatus.ACTIVE  } }),
    db.campaign.create({ data: { brandId: brand3.id, title: "Sustainable Living Series",          description: "3-part content series about transitioning to sustainable living using our product range.",              budget: 3500, niche: "Lifestyle",      status: CampaignStatus.ACTIVE  } }),
    db.campaign.create({ data: { brandId: brand3.id, title: "Earth Day Campaign",                 description: "Earth Day awareness content. Feature our products naturally with a sustainability message.",            budget: 2200, niche: "Sustainability", status: CampaignStatus.CLOSED  } }),
  ]);

  // ─── Applications ─────────────────────────────────────────────
  const [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10] = await Promise.all([
    db.application.create({ data: { campaignId: c1.id, creatorId: cr1.id, status: ApplicationStatus.ACCEPTED, pitch: "I'd love to feature your summer pieces in outdoor lifestyle shoots. My audience is 80% women aged 22–35 who follow sustainable fashion." } }),
    db.application.create({ data: { campaignId: c2.id, creatorId: cr1.id, status: ApplicationStatus.PENDING,  pitch: "Streetwear is my specialty. I can create authentic back-to-school content with a university campus aesthetic." } }),
    db.application.create({ data: { campaignId: c1.id, creatorId: cr3.id, status: ApplicationStatus.REJECTED, pitch: "I'd love to feature the collection in my lifestyle content. Strong alignment with sustainable values." } }),
    db.application.create({ data: { campaignId: c4.id, creatorId: cr2.id, status: ApplicationStatus.ACCEPTED, pitch: "Tech reviews are my bread and butter. My audience trusts my audio gear comparisons specifically." } }),
    db.application.create({ data: { campaignId: c5.id, creatorId: cr2.id, status: ApplicationStatus.ACCEPTED, pitch: "I've reviewed 3 charging stands this year. Happy to do a side-by-side fast-charge demo." } }),
    db.application.create({ data: { campaignId: c6.id, creatorId: cr3.id, status: ApplicationStatus.ACCEPTED, pitch: "Sustainable living is central to my content. I'd integrate the kitchen bundle naturally into my weekly cooking vlogs." } }),
    db.application.create({ data: { campaignId: c6.id, creatorId: cr5.id, status: ApplicationStatus.PENDING,  pitch: "As a plant-based food creator, zero-waste kitchen tools are what my audience actively looks for." } }),
    db.application.create({ data: { campaignId: c7.id, creatorId: cr3.id, status: ApplicationStatus.ACCEPTED, pitch: "A 3-part series is exactly my format. I'd weave your products into my ongoing sustainable living journey." } }),
    db.application.create({ data: { campaignId: c7.id, creatorId: cr4.id, status: ApplicationStatus.PENDING,  pitch: "Fitness and sustainable living overlap a lot in my content. I can bring a fresh eco-fitness angle." } }),
    db.application.create({ data: { campaignId: c8.id, creatorId: cr2.id, status: ApplicationStatus.ACCEPTED, pitch: "I covered Earth Day for 2 brands last year. I'll create a tech-meets-sustainability narrative." } }),
  ]);

  // ─── Collaborations ───────────────────────────────────────────
  const [col1, col2, col3, col4, col5, col6] = await Promise.all([
    db.collaboration.create({ data: { applicationId: a1.id,  agreedRate: 1200, status: CollaborationStatus.ACTIVE,     notes: "3 Instagram Reels + 2 TikToks. Deliverables due end of month." } }),
    db.collaboration.create({ data: { applicationId: a4.id,  agreedRate: 1500, status: CollaborationStatus.ACTIVE,     notes: "1 YouTube review + 2 TikToks. Talking points provided by brand." } }),
    db.collaboration.create({ data: { applicationId: a5.id,  agreedRate: 800,  status: CollaborationStatus.COMPLETED,  notes: "Campaign completed. All content approved.", completedAt: new Date("2025-03-15") } }),
    db.collaboration.create({ data: { applicationId: a6.id,  agreedRate: 900,  status: CollaborationStatus.ACTIVE,     notes: "2 cooking videos featuring the bundle. Natural integration preferred." } }),
    db.collaboration.create({ data: { applicationId: a8.id,  agreedRate: 1800, status: CollaborationStatus.ACTIVE,     notes: "3-part series, one video per week for 3 weeks." } }),
    db.collaboration.create({ data: { applicationId: a10.id, agreedRate: 1000, status: CollaborationStatus.COMPLETED,  notes: "Earth Day campaign. Completed April 22.", completedAt: new Date("2025-04-22") } }),
  ]);

  // ─── Content Submissions ──────────────────────────────────────
  await Promise.all([
    db.contentSubmission.create({ data: { collaborationId: col1.id, videoUrl: "https://www.tiktok.com/@avamartinez/video/123456",        caption: "Summer vibes in StyleHouse's linen collection 🌿 #sustainablefashion",               status: SubmissionStatus.PENDING  } }),
    db.contentSubmission.create({ data: { collaborationId: col2.id, videoUrl: "https://www.youtube.com/watch?v=abc123",                 caption: "ProBuds X full review — is it worth $129? My honest take after 2 weeks.",            status: SubmissionStatus.APPROVED, feedback: "Great content! Exactly what we needed. Payment being processed." } }),
    db.contentSubmission.create({ data: { collaborationId: col3.id, videoUrl: "https://www.tiktok.com/@jakechentech/video/789012",      caption: "MagCharge wireless stand — fastest I've tested. Full review in bio.",                status: SubmissionStatus.APPROVED, feedback: "Perfect delivery. Thank you Jake!" } }),
    db.contentSubmission.create({ data: { collaborationId: col4.id, videoUrl: "https://www.instagram.com/reel/xyz789",                  caption: "Switching to zero-waste kitchen tools this month. Honest first impressions.",        status: SubmissionStatus.REJECTED, feedback: "Love the concept but product mention was too brief. Please resubmit with 30s+ product focus." } }),
    db.contentSubmission.create({ data: { collaborationId: col6.id, videoUrl: "https://www.tiktok.com/@jakechentech/video/earthday22",  caption: "This Earth Day, small changes matter. Here's how GreenEarth fits my daily routine.", status: SubmissionStatus.APPROVED, feedback: "Excellent Earth Day content. Authentic and on-brand." } }),
  ]);

  // ─── Payments ─────────────────────────────────────────────────
  await Promise.all([
    db.payment.create({ data: { collaborationId: col2.id, amount: 1500, status: PaymentStatus.PENDING } }),
    db.payment.create({ data: { collaborationId: col3.id, amount: 800,  status: PaymentStatus.PAID, paidAt: new Date("2025-03-20") } }),
    db.payment.create({ data: { collaborationId: col6.id, amount: 1000, status: PaymentStatus.PAID, paidAt: new Date("2025-04-25") } }),
  ]);

  // ─── Portfolio Items ──────────────────────────────────────────
  await Promise.all([
    db.portfolioItem.create({ data: { creatorId: cr1.id, mediaUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800", mediaType: MediaType.IMAGE, caption: "Summer lookbook shoot"         } }),
    db.portfolioItem.create({ data: { creatorId: cr1.id, mediaUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800", mediaType: MediaType.IMAGE, caption: "Street style editorial"        } }),
    db.portfolioItem.create({ data: { creatorId: cr1.id, mediaUrl: "https://www.tiktok.com/@avamartinez/video/sample1",                  mediaType: MediaType.VIDEO, caption: "GRWM spring transition"        } }),
    db.portfolioItem.create({ data: { creatorId: cr2.id, mediaUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800",    mediaType: MediaType.IMAGE, caption: "Smartwatch comparison flat lay" } }),
    db.portfolioItem.create({ data: { creatorId: cr2.id, mediaUrl: "https://www.youtube.com/watch?v=sample_tech",                        mediaType: MediaType.VIDEO, caption: "Top 5 earbuds of 2025"         } }),
    db.portfolioItem.create({ data: { creatorId: cr3.id, mediaUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800", mediaType: MediaType.IMAGE, caption: "Morning routine aesthetic"     } }),
    db.portfolioItem.create({ data: { creatorId: cr3.id, mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", mediaType: MediaType.IMAGE, caption: "Travel & mindfulness — Bali"   } }),
    db.portfolioItem.create({ data: { creatorId: cr3.id, mediaUrl: "https://www.instagram.com/reel/sofia_sample",                        mediaType: MediaType.VIDEO, caption: "Zero waste week challenge"      } }),
    db.portfolioItem.create({ data: { creatorId: cr4.id, mediaUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", mediaType: MediaType.IMAGE, caption: "Gym workout series"             } }),
    db.portfolioItem.create({ data: { creatorId: cr4.id, mediaUrl: "https://www.tiktok.com/@marcusfits/video/workout1",                  mediaType: MediaType.VIDEO, caption: "Full body HIIT 20 min"          } }),
    db.portfolioItem.create({ data: { creatorId: cr5.id, mediaUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800", mediaType: MediaType.IMAGE, caption: "Plant-based bowl prep"          } }),
    db.portfolioItem.create({ data: { creatorId: cr5.id, mediaUrl: "https://www.tiktok.com/@emmacooks/video/recipe1",                    mediaType: MediaType.VIDEO, caption: "10 min vegan dinner"            } }),
  ]);

  // ─── Notifications ────────────────────────────────────────────
  await Promise.all([
    db.notification.create({ data: { userId: cu1.id, message: "Your application for 'Summer Collection 2025 Launch' was accepted!",            type: "APPLICATION_ACCEPTED", linkHref: "/creator/collaborations", isRead: true  } }),
    db.notification.create({ data: { userId: cu1.id, message: "Your content submission is under review.",                                       type: "SUBMISSION_PENDING",   linkHref: "/creator/collaborations", isRead: false } }),
    db.notification.create({ data: { userId: bu1.id, message: "Ava Martinez applied to 'Summer Collection 2025 Launch'.",                       type: "NEW_APPLICATION",      linkHref: "/brand/campaigns",        isRead: true  } }),
    db.notification.create({ data: { userId: bu1.id, message: "Sofia Patel applied to 'Summer Collection 2025 Launch'.",                        type: "NEW_APPLICATION",      linkHref: "/brand/campaigns",        isRead: false } }),
    db.notification.create({ data: { userId: cu2.id, message: "Your application for 'ProBuds X Earbuds Review' was accepted!",                  type: "APPLICATION_ACCEPTED", linkHref: "/creator/collaborations", isRead: true  } }),
    db.notification.create({ data: { userId: cu2.id, message: "Your content for 'ProBuds X' was approved! Payment is being processed.",         type: "SUBMISSION_APPROVED",  linkHref: "/creator/collaborations", isRead: false } }),
    db.notification.create({ data: { userId: bu2.id, message: "Jake Chen submitted content for 'ProBuds X Earbuds Review'.",                    type: "NEW_SUBMISSION",       linkHref: "/brand/campaigns",        isRead: false } }),
    db.notification.create({ data: { userId: cu3.id, message: "Your content for 'Zero Waste Kitchen Bundle' needs revision. Check feedback.",   type: "SUBMISSION_REJECTED",  linkHref: "/creator/collaborations", isRead: false } }),
  ]);

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo accounts (password: demo1234)");
  console.log("  Brands   → brand@demo.com / brand2@demo.com / brand3@demo.com");
  console.log("  Creators → creator@demo.com .. creator5@demo.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
