const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.deal.deleteMany();
  await prisma.influencerProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const hashedPassword1 = await bcrypt.hash("password123", 10);
  const hashedPassword2 = await bcrypt.hash("password123", 10);
  const hashedPassword3 = await bcrypt.hash("password123", 10);

  const influencer1 = await prisma.user.create({
    data: {
      email: "influencer1@example.com",
      password: hashedPassword1,
      role: "INFLUENCER",
    },
  });

  const influencer2 = await prisma.user.create({
    data: {
      email: "influencer2@example.com",
      password: hashedPassword1,
      role: "INFLUENCER",
    },
  });

  const company1 = await prisma.user.create({
    data: {
      email: "company1@example.com",
      password: hashedPassword2,
      role: "COMPANY",
    },
  });

  // Create influencer profiles
  await prisma.influencerProfile.create({
    data: {
      userId: influencer1.id,
      name: "Priya Sharma",
      bio: "Fashion and lifestyle influencer passionate about sustainable fashion",
      avatar: "https://i.pravatar.cc/150?img=1",
      niche: "Fashion",
      instagram: "@priya_fashion",
      youtube: "Priya Vlogs",
      instagramFollowers: 150000,
      youtubeFollowers: 280000,
      ratePerPost: 25000,
      currency: "INR",
      location: "Mumbai, India",
    },
  });

  await prisma.influencerProfile.create({
    data: {
      userId: influencer2.id,
      name: "Raj Malhotra",
      bio: "Tech reviewer and gadget enthusiast",
      avatar: "https://i.pravatar.cc/150?img=2",
      niche: "Tech",
      instagram: "@raj_tech",
      youtube: "Raj Reviews",
      tiktok: "@raj_tech",
      instagramFollowers: 200000,
      youtubeFollowers: 450000,
      tiktokFollowers: 320000,
      ratePerPost: 35000,
      currency: "INR",
      location: "Bangalore, India",
    },
  });

  // Create company profile
  await prisma.companyProfile.create({
    data: {
      userId: company1.id,
      companyName: "StyleHub Fashion",
      industry: "Fashion & Retail",
      website: "https://stylehub.com",
      description:
        "Leading online fashion retailer connecting customers with sustainable brands",
      budget: "500000-2000000",
    },
  });

  // Create sample deals
  await prisma.deal.create({
    data: {
      companyId: company1.id,
      influencerId: influencer1.id,
      title: "Summer Collection Campaign",
      description:
        "Promote our new summer collection through Instagram Reels and Stories",
      dealValue: 50000,
      commission: 5000,
      status: "PENDING",
    },
  });

  await prisma.deal.create({
    data: {
      companyId: company1.id,
      influencerId: influencer2.id,
      title: "Product Review Partnership",
      description: "Create a detailed review video of our new smart gadgets",
      dealValue: 75000,
      commission: 7500,
      status: "ACCEPTED",
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
