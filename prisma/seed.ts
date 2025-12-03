import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  {
    name: "New Sub Welcome",
    category: "NEW_SUB_WELCOME",
    segment: "NEW",
    body: "Hey {first_name}! You’re officially on my VIP list. Want a private tour of what you just unlocked? 💌",
  },
  {
    name: "Whale Appreciation",
    category: "WHALE_UPSELL",
    segment: "WHALE",
    body: "You always take such good care of me... I filmed something special just for you. Want me to drop the link now?",
  },
  {
    name: "Rebill Saver",
    category: "EXPIRING_REBILL",
    segment: "EXPIRING",
    body: "Heads up: your VIP perks expire soon. Want me to renew you at the same rate so you don’t miss a thing?",
  },
  {
    name: "Ghost Recovery",
    category: "GHOST_RECOVERY",
    segment: "GHOST",
    body: "Miss our chats, {first_name}. I’ve been into trouble again and need you back in my DMs. 🖤",
  },
  {
    name: "Weekend Boost",
    category: "WEEKEND_PROMO",
    segment: "MID",
    body: "Weekend energy is here and I’m in a mood… want first dibs before I open this to everyone?",
  },
];

async function main() {
  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { creatorAccountId: null, name: template.name },
    });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          category: template.category as any,
          segment: template.segment as any,
          body: template.body,
          isDefault: true,
        },
      });
    } else {
      await prisma.template.create({
        data: {
          name: template.name,
          category: template.category as any,
          segment: template.segment as any,
          body: template.body,
          isDefault: true,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

