import { HeroSlider } from '@/components/home/hero';
import MainSection from '@/components/home/main-section';

export default function HomePage() {

    return (
        <>
            <div className="relative -mx-4 -mt-6 mb-6 w-[calc(100%+2rem)] max-w-none">
                <HeroSlider />
            </div>
            <MainSection />
        </>
    );
}
