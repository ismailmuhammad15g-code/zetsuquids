import { FAQ } from "@/components/ui/faq-section";
import { Quote } from "@/components/ui/quote";

function FAQDemo() {
  return (
    <div className="w-full">
      <FAQ />
      <div className="py-20 bg-gray-50/50">
        <Quote />
      </div>
    </div>
  );
}

export { FAQDemo };
export default FAQDemo;
