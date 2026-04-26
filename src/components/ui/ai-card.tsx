import { useEffect } from "react";

// AI Logos Card Component
export function AICard() {
    return (
        <Card>
            <CardSkeletonContainer>
                <Skeleton />
            </CardSkeletonContainer>
            <CardTitle>Powered by Zetsuserv</CardTitle>
            <CardDescription>
                ZetsuGuide AI uses cutting-edge AI models to help you learn, code, and create amazing projects.
            </CardDescription>
        </Card>
    );
}

const Skeleton = () => {
    useEffect(() => {
        // Simple animation using CSS instead of motion's animate
        const animateCircles = () => {
            const circles = document.querySelectorAll('[class*="circle-"]');
            circles.forEach((circle, index) => {
                setTimeout(() => {
                    (circle as HTMLElement).style.transform = 'translateY(-4px) scale(1.1)';
                    setTimeout(() => {
                        (circle as HTMLElement).style.transform = 'translateY(0px) scale(1)';
                    }, 400);
                }, index * 800);
            });
        };

        animateCircles();
        const interval = setInterval(animateCircles, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
            <div className="flex flex-row shrink-0 justify-center items-center gap-2">
                <Container className="h-8 w-8 circle-1">
                    <ClaudeLogo className="h-4 w-4" />
                </Container>
                <Container className="h-12 w-12 circle-2">
                    <CopilotLogo className="h-6 w-6 text-white" />
                </Container>
                <Container className="circle-3">
                    <OpenAILogo className="h-8 w-8 text-white" />
                </Container>
                <Container className="h-12 w-12 circle-4">
                    <MetaIconOutline className="h-6 w-6" />
                </Container>
                <Container className="h-8 w-8 circle-5">
                    <GeminiLogo className="h-4 w-4" />
                </Container>
            </div>
            <div className="h-40 w-px absolute top-20 m-auto z-40 bg-gradient-to-b from-transparent via-white to-transparent animate-move">
                <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
                    <Sparkles />
                </div>
            </div>

            <style>{`
                @keyframes move {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                .animate-move {
                    animation: move 3s ease-in-out infinite;
                }
                [class*="circle-"] {
                    transition: transform 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

const Sparkles = () => {
    return (
        <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
                <div key={i} />
            ))}
        </div>
    );
};

interface ContainerProps {
    className?: string;
    children?: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ className, children }) => (
    <div className={className}>{children}</div>
);

const Card: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div>{children}</div>
);

const CardSkeletonContainer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div>{children}</div>
);

const CardTitle: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <h3>{children}</h3>
);

const CardDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <p>{children}</p>
);

const ClaudeLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" />
);

const CopilotLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" />
);

const OpenAILogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" />
);

const MetaIconOutline: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" />
);

const GeminiLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" />
);
