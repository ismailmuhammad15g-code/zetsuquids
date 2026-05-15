import Link from 'next/link';
import { Star, Download, Code2, Cpu, LayoutTemplate, ShieldCheck } from 'lucide-react';

// Mock data to simulate the marketplace
const mockScripts = [
  {
    id: '1',
    title: 'Ultimate React Admin Dashboard',
    description: 'A fully responsive, modern admin dashboard built with React, Tailwind CSS, and Recharts. Includes 50+ pages.',
    price: 24.00,
    author: 'ZetsuStudios',
    sales: 1240,
    rating: 4.8,
    category: 'React',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    icon: <LayoutTemplate className="text-blue-500" />
  },
  {
    id: '2',
    title: 'Secure PHP Auth System',
    description: 'Production-ready authentication system for PHP with 2FA, email verification, and role management.',
    price: 15.00,
    author: 'CodeNinja',
    sales: 856,
    rating: 4.5,
    category: 'PHP',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    icon: <ShieldCheck className="text-purple-500" />
  },
  {
    id: '3',
    title: 'Python Web Scraper Pro',
    description: 'Advanced Python scraper with proxy rotation, CAPTCHA solving, and multi-threading capabilities.',
    price: 35.00,
    author: 'DataTech',
    sales: 432,
    rating: 4.9,
    category: 'Python',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    icon: <Cpu className="text-green-500" />
  },
  {
    id: '4',
    title: 'Next.js E-Commerce Starter',
    description: 'Complete e-commerce solution using Next.js App Router, Stripe integration, and Sanity CMS.',
    price: 49.00,
    author: 'NextMasters',
    sales: 2100,
    rating: 4.7,
    category: 'Next.js',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=600&q=80',
    icon: <Code2 className="text-indigo-500" />
  },
  {
    id: '5',
    title: 'Vue 3 UI Kit',
    description: 'Over 100+ accessible components built with Vue 3 and styled with Tailwind CSS.',
    price: 19.00,
    author: 'VueExperts',
    sales: 650,
    rating: 4.6,
    category: 'Vue',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=600&q=80',
    icon: <LayoutTemplate className="text-emerald-500" />
  },
  {
    id: '6',
    title: 'Node.js REST API Boilerplate',
    description: 'Scalable REST API boilerplate with Express, MongoDB, Swagger docs, and Docker support.',
    price: 22.00,
    author: 'BackendPro',
    sales: 1120,
    rating: 4.8,
    category: 'Node.js',
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=600&q=80',
    icon: <Cpu className="text-gray-700" />
  }
];

export default function ScriptsMarketplace() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-indigo-600 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Discover the Best Scripts & Code
          </h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            Thousands of high-quality scripts, plugins, and templates to kickstart your next big project. 
            From React templates to complex Python systems.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1">
              Browse All
            </button>
            <Link href="/scripts/console" className="bg-indigo-500 text-white border border-indigo-400 hover:bg-indigo-400 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1">
              Start Selling
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Scripts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Scripts</h2>
            <p className="text-gray-500 mt-1">Hand-picked premium code from our top authors.</p>
          </div>
          <button className="text-indigo-600 font-medium hover:text-indigo-700">View All →</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockScripts.map((script) => (
            <Link href={`/scripts/${script.id}`} key={script.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
              {/* Image Container */}
              <div className="h-48 w-full overflow-hidden relative bg-gray-100">
                <img 
                  src={script.image} 
                  alt={script.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                  {script.icon}
                  {script.category}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{script.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{script.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                    <Star size={16} className="fill-amber-500" />
                    <span>{script.rating}</span>
                    <span className="text-gray-400 font-normal ml-1">({script.sales})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Download size={14} />
                    {script.sales} Sales
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700 hover:text-indigo-600">{script.author}</span></span>
                  <span className="font-extrabold text-xl text-gray-900">${script.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Categories Banner */}
      <div className="bg-white border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'PHP', 'Python', 'Next.js', 'Vue', 'Node.js', 'HTML5', 'WordPress', 'C#', 'Flutter'].map(cat => (
              <button key={cat} className="px-6 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 rounded-full font-medium text-gray-700 transition-colors">
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
