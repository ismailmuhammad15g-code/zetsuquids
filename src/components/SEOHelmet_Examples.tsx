import type { ComponentProps } from "react";
import SEOHelmet from "../components/SEOHelmet";

type SEOHelmetProps = ComponentProps<typeof SEOHelmet>;

type SEOExample = {
    name: string;
    route: string;
    props: SEOHelmetProps;
};

// Typed usage references for SEOHelmet across major routes.
export const SEO_HELMET_EXAMPLES: SEOExample[] = [
    {
        name: "HomePage",
        route: "/",
        props: {
            title: "Home",
            description:
                "Create and share comprehensive programming guides with AI assistance. Join our community of developers and explore tutorials, code examples, and best practices.",
            keywords:
                "developer guides, programming tutorials, AI guide generator, developer community",
        },
    },
    {
        name: "AllGuidesPage",
        route: "/guides",
        props: {
            title: "All Developer Guides",
            description:
                "Browse our comprehensive collection of developer guides, tutorials, and code examples. Learn programming, best practices, and modern development techniques.",
            keywords:
                "developer guides, programming tutorials, code examples, learning resources",
        },
    },
    {
        name: "CommunityPage",
        route: "/community",
        props: {
            title: "Developer Community",
            description:
                "Join our thriving community of developers. Share posts, connect with other developers, and participate in discussions about programming and technology.",
            keywords:
                "developer community, programming forum, tech community, developer networking",
        },
    },
    {
        name: "PricingPage",
        route: "/pricing",
        props: {
            title: "Pricing Plans",
            description:
                "Choose the perfect plan for your needs. Get access to premium features, unlimited guide creation, and priority support. Flexible pricing for individuals and teams.",
            keywords: "pricing, plans, subscription, premium features",
        },
    },
    {
        name: "AdminConsole",
        route: "/admin",
        props: {
            title: "Admin Console",
            description: "Administrative dashboard",
            noindex: true,
        },
    },
    {
        name: "FAQPage",
        route: "/faq",
        props: {
            title: "Frequently Asked Questions",
            description:
                "Find answers to common questions about ZetsuGuide. Learn about features, pricing, account management, and more.",
            keywords: "FAQ, frequently asked questions, help, support, how to",
        },
    },
    {
        name: "SupportPage",
        route: "/support",
        props: {
            title: "Contact Support",
            description:
                "Need help? Contact our support team. We're here to answer your questions and help you get the most out of ZetsuGuide.",
            keywords: "support, help, contact, customer service",
        },
    },
];

export default SEO_HELMET_EXAMPLES;
