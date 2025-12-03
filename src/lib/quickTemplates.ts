
export type AccountRole = "CREATOR" | "DANCER" | "CLUB";

export type QuickTemplate = {
  id: string;
  label: string;
  description?: string;
  body: string;
  useCase: "NEW_DROP" | "WIN_BACK" | "EVENT" | "BIRTHDAY" | "VIP_PUSH" | "OTHER";
};

export const QUICK_TEMPLATES: Record<AccountRole, QuickTemplate[]> = {
  CREATOR: [
    {
      id: "creator_new_drop",
      label: "New drop / fresh content",
      useCase: "NEW_DROP",
      description: "Announce new content and tease a special offer.",
      body:
        "Hey love, I just dropped something new 🖤 Check your DMs. If you want something custom tonight, reply ‘CUSTOM’.",
    },
    {
      id: "creator_win_back",
      label: "Win-back inactive fans",
      useCase: "WIN_BACK",
      description: "Re-engage people who haven’t bought in a while.",
      body:
        "Haven’t seen you in a bit 👀 I’m filming later—want me to send you a preview?",
    },
    {
      id: "creator_whale_push",
      label: "Whale tease / high spenders",
      useCase: "VIP_PUSH",
      description: "Give your top spenders something to chase.",
      body:
        "You always go crazy for my best stuff 😈 Want me to send you something wild tonight?",
    },
  ],

  DANCER: [
    {
      id: "dancer_tonight",
      label: "Working tonight",
      useCase: "EVENT",
      description: "Let regulars know you’re on the floor.",
      body:
        "I’m working tonight 10–2 💋 come see me, I’ll make sure you’re taken care of.",
    },
    {
      id: "dancer_win_back",
      label: "Win-back regulars",
      useCase: "WIN_BACK",
      description: "Remind people who haven’t pulled up in a while.",
      body:
        "It’s been a minute… I’m back at the club this weekend 👀 you should pull up.",
    },
    {
      id: "dancer_vip_room",
      label: "VIP room invite",
      useCase: "VIP_PUSH",
      description: "Upsell VIP room time.",
      body:
        "If you’re in town tonight, I’ve got time for a VIP room—want me to reserve you?",
    },
  ],

  CLUB: [
    {
      id: "club_event_vip",
      label: "VIP night promo",
      useCase: "EVENT",
      description: "Standard VIP night blast.",
      body:
        "VIP night this Friday 🎉 free entry for you + 1 before 11pm. Show this text at the door.",
    },
    {
      id: "club_birthday_month",
      label: "Birthday month offer",
      useCase: "BIRTHDAY",
      description: "Birthday-month bottle/table upgrade.",
      body:
        "It’s your birthday month 🎂 come celebrate with us—text back to get a bottle or table upgrade this weekend.",
    },
    {
      id: "club_win_back_vip",
      label: "Win-back VIPs",
      useCase: "WIN_BACK",
      description: "Bring cold VIPs back in.",
      body:
        "We haven’t seen you in a while—come by this weekend and we’ll take care of your cover.",
    },
  ],
};

export function getQuickTemplatesForRole(role: AccountRole): QuickTemplate[] {
  return QUICK_TEMPLATES[role] ?? [];
}

