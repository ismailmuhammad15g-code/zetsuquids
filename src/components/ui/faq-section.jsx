import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

const faqData = [
  {
    question: "What is ZetsuGuide?",
    answer:
      "ZetsuGuide is your personal developer knowledge base. It allows you to save, organize, and search through your technical guides, tutorials, and code snippets. With our AI-powered features, you can interact with your knowledge base to find answers quickly.",
  },
  {
    question: "Is ZetsuGuide free to use?",
    answer:
      "Yes, we offer a Free plan for individuals that includes access to public guides, 5 AI credits per day, and community support. For advanced features like private guides and unlimited AI credits, check out our Teams and Organization plans.",
  },
  {
    question: "How do AI Credits work?",
    answer:
      "AI Credits are used when you interact with the ZetsuGuide AI assistant. Basic queries cost 1 credit. Free users get a daily refill of 5 credits. Paid plans offer significantly more or unlimited credits depending on the tier.",
  },
  {
    question: "Can I share my guides with others?",
    answer:
      "Absolutely! You can choose to make your guides public to share them with the community, or keep them private for your own use (Teams plan). You can also share specific workspaces with your team members on the Organization plan.",
  },
  {
    question: "What formatting does ZetsuGuide support?",
    answer:
      "We support full Markdown formatting, including code blocks with syntax highlighting, headers, lists, links, and images. This ensures your technical documentation looks clean and professional.",
  },
  {
    question: "How do I report a bug or suggest a feature?",
    answer:
      "We value your feedback! You can use the 'Report Bug' page accessible from the footer to submit issues. For feature requests, feel free to contact our support team or join our community discussions.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, security is our top priority. We use industry-standard encryption for data at rest and in transit. Your private guides are strictly accessible only to you and authorized team members.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 14-day money-back guarantee for all our paid plans. If you are not satisfied with ZetsuGuide, simply contact our support team within 14 days of your purchase for a full refund.",
  },
];

function FAQ() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">FAQ</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Common Questions & Answers
                </h4>
                <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                  Find answers to the most frequently asked questions about
                  ZetsuGuide. Can't find what you're looking for? Our support
                  team is here to help you get the most out of your developer
                  journey.
                </p>
              </div>
              <div className="">
                <Button
                  className="gap-4"
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "mailto:support@zetsuguide.com")
                  }
                >
                  Any questions? Reach out <PhoneCall className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item, index) => (
              <AccordionItem key={index} value={"index-" + index}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export { FAQ };
export default FAQ;
