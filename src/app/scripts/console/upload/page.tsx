'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload, Loader2, Github, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadScriptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    long_description: '',
    price: '',
    category: 'React',
    tags: '',
    version: '1.0.0',
    features: '',
    github_repo_url: '',
    thumbnail_url: '',
    preview_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be logged in to upload scripts.');
      return;
    }

    setLoading(true);

    try {
      // Process features and tags into arrays
      const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const priceNum = parseFloat(formData.price);

      // We need the author's name from user profile or metadata
      const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
      const authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

      const payload: any = {
        title: formData.title,
        description: formData.description,
        long_description: formData.long_description || null,
        price: isNaN(priceNum) ? 0 : priceNum,
        category: formData.category,
        tags: tagsArray.length > 0 ? tagsArray : [],
        version: formData.version || '1.0.0',
        features: featuresArray.length > 0 ? featuresArray : [],
        github_repo_url: formData.github_repo_url || null,
        thumbnail_url: formData.thumbnail_url || null,
        preview_url: formData.preview_url || null,
        author_id: user.id,
        author_name: authorName,
        author_avatar: authorAvatar,
        status: 'Active'
      };

      // Clean up empty strings that might cause issues with UUID or URLs
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      const { error } = await supabase.from('marketplace_scripts').insert([payload]);

      if (error) {
        console.error("Upload error details:", JSON.stringify(error, null, 2));
        toast.error(`Error uploading: ${error.message || error.details || 'Unknown error'}`);
      } else {
        toast.success("Script published successfully!");
        setSuccess(true);
        setTimeout(() => {
          router.push('/scripts/console');
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
         <p className="text-gray-500 mb-6">Please log in to access this page.</p>
         <Link href="/auth" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-500 mb-6">Your script has been published to the marketplace.</p>
          <Loader2 className="animate-spin mx-auto text-indigo-600" size={24} />
          <p className="text-sm text-gray-400 mt-2">Redirecting to console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/scripts/console" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Console
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="text-indigo-600" />
              Upload New Script
            </h1>
            <p className="text-gray-500 mt-1">Fill out the details to list your code on ZetsuMarket.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Script Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Ultimate React Admin Dashboard" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description *</label>
                  <input required name="description" value={formData.description} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="A brief summary for the script card (max 150 chars)" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Long Description</label>
                  <textarea name="long_description" value={formData.long_description} onChange={handleChange} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Detailed description of what your script does..." />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                  <select required name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="React">React</option>
                    <option value="Next.js">Next.js</option>
                    <option value="Vue">Vue</option>
                    <option value="PHP">PHP</option>
                    <option value="Python">Python</option>
                    <option value="Node.js">Node.js</option>
                    <option value="HTML5">HTML5 Templates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input required name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" min="0" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="19.99" />
                  </div>
                </div>
              </div>
            </div>

            {/* Details & Features */}
            <div className="space-y-6 pt-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Technical Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Version</label>
                  <input name="version" value={formData.version} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="1.0.0" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tags</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="React, Dashboard, Tailwind (comma separated)" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Key Features (One per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Fully Responsive&#10;Dark Mode Support&#10;Clean Code" />
                </div>
              </div>
            </div>

            {/* URLs & Files */}
            <div className="space-y-6 pt-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Media & Files</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail Image URL</label>
                  <input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://example.com/image.jpg" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Live Preview URL (Optional)</label>
                  <input name="preview_url" value={formData.preview_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://my-script-demo.com" />
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <Github size={20} /> GitHub Source Repository
                  </h3>
                  <p className="text-sm text-indigo-700 mb-4">
                    Provide the URL to the private GitHub repository containing your script. Buyers will receive access upon purchase.
                  </p>
                  <input required name="github_repo_url" value={formData.github_repo_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://github.com/username/my-awesome-script" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
              <Link href="/scripts/console" className="px-6 py-2.5 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </Link>
              <button disabled={loading} type="submit" className="px-8 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Publish Script
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
