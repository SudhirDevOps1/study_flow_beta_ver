import { motion } from "framer-motion";
import { Panel } from "@/components/common/Panel";

export function GuidePage() {
  const sections = [
    {
      title: "What is FlowTrack? / FlowTrack क्या है?",
      icon: "🛡️",
      content: {
        en: "FlowTrack is a privacy-first, local-only study tracker designed to help you focus and improve your learning habits without your data ever leaving your device.",
        hi: "FlowTrack एक 'Privacy-First' ऐप है जो पूरी तरह से आपके डिवाइस पर चलती है। यह आपकी पढ़ाई की आदतों को ट्रैक करने और एकाग्रता (focus) बढ़ाने के लिए बनाया गया है।"
      }
    },
    {
      title: "How to Use / उपयोग कैसे करें?",
      icon: "🚀",
      content: {
        en: [
          "Step 1: Go to 'Subjects' and add the topics you study.",
          "Step 2: Go to 'Timer' to start tracking your session.",
          "Step 3: Use the 'Pomodoro' mode for structured focus sessions.",
          "Step 4: Check 'Dashboard' for detailed analytics on your progress."
        ],
        hi: [
          "चरण 1: 'Subjects' पेज पर जाएं और अपने विषयों को जोड़ें।",
          "चरण 2: 'Timer' पेज पर जाकर पढ़ाई शुरू करने के लिए स्टार्ट पर क्लिक करें।",
          "चरण 3: अपनी पढ़ाई को टाइम-ब्लॉक्स में बांटने के लिए 'Pomodoro' का इस्तेमाल करें।",
          "चरण 4: अपनी प्रगति देखने के लिए 'Dashboard' पर जाकर ग्राफ और स्टेट्स देखें।"
        ]
      }
    },
    {
      title: "Key Features / मुख्य विशेषताएं",
      icon: "✨",
      content: {
        en: [
          "100% Local: Your data is never uploaded to any server.",
          "Strict Focus: Automatically pauses if you try to switch tabs (Strict Mode).",
          "Achievements: Unlock badges as you hit your goals!",
          "Customization: Beautiful themes including Neon and Paper modes."
        ],
        hi: [
          "100% लोकल: आपका डेटा कभी किसी सर्वर पर नहीं भेजा जाता।",
          "Strict Focus: अगर आप टैब बदलते हैं, तो टाइमर अपने आप रुक जाता है (यदि ऑन हो)।",
          "Achievements: गोल पूरा करने पर शानदार बैज जीतें!",
          "Customization: नियॉन (Neon) और पेपर (Paper) जैसे प्रीमियम थीम्स।"
        ]
      }
    },
    {
      title: "Premium Features / प्रीमियम फीचर्स",
      icon: "💎",
      content: {
        en: [
          "Focus Soundscapes: Play Rain or Forest sounds while studying.",
          "AI Insights: Local analysis of your peak focus times.",
          "Gamification: Earn XP and rank up to Zen Sage.",
          "Reports: Download professional PDF reports for mentors."
        ],
        hi: [
          "Focus Soundscapes: पढ़ाई के दौरान बारिश या जंगल की आवाजें बजाएं।",
          "AI Insights: आपके सबसे अच्छे पढ़ाई के समय का लोकल विश्लेषण।",
          "Gamification: XP कमाएं और 'Zen Sage' तक रैंक बढ़ाएं।",
          "Reports: सलाहकारों के लिए पेशेवर PDF रिपोर्ट डाउनलोड करें।"
        ]
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <header className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent italic">
          FlowTrack Guide / गाइड
        </h1>
        <p className="text-slate-400">Everything you need to know to master your study routine / अपनी पढ़ाई को बेहतर बनाने की पूरी जानकारी</p>
      </header>

      <div className="grid gap-6">
        {sections.map((section, idx) => (
          <Panel key={idx} className="p-6 space-y-4 border-l-4 border-theme-primary">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{section.icon}</span>
              <h2 className="text-xl font-bold text-slate-100">{section.title}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-primary opacity-80">English</h3>
                {Array.isArray(section.content.en) ? (
                  <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                    {section.content.en.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="text-slate-300 text-sm leading-relaxed">{section.content.en}</p>
                )}
              </div>
              
              <div className="space-y-3 border-l md:border-l border-white/5 pl-0 md:pl-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-secondary opacity-80">हिंदी (Hindi)</h3>
                {Array.isArray(section.content.hi) ? (
                  <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                    {section.content.hi.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="text-slate-300 text-sm leading-relaxed">{section.content.hi}</p>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <footer className="text-center pt-8 pb-4">
        <Panel className="p-4 bg-theme-primary/5 inline-block">
          <p className="text-sm text-slate-400 italic">
            "Your data. Your device. Your focus." / "आपका डेटा। आपका डिवाइस। आपका फोकस।"
          </p>
        </Panel>
      </footer>
    </motion.div>
  );
}
