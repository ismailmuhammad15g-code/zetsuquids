'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Loader2, Github, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function EditScriptPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    preview_url: '',
    contact_url: ''
  });

  useEffect(() => {
    if (user && id) {
      fetchScript();
    }
  }, [user, id]);

  const fetchScript = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('id', id)
        .eq('author_id', user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Script not found or you do not have permission to edit it');
        router.push('/scripts/console');
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        long_description: data.long_description || '',
        price: data.price?.toString() || '',
        category: data.category || 'React',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        version: data.version || '1.0.0',
        features: Array.isArray(data.features) ? data.features.join('\n') : '',
        github_repo_url: data.github_repo_url || '',
        thumbnail_url: data.thumbnail_url || '',
        preview_url: data.preview_url || '',
        contact_url: data.contact_url || ''
      });
    } catch (err: any) {
      toast.error('Failed to load script');
      router.push('/scripts/console');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be logged in.');
      return;
    }

    setLoading(true);

    try {
      const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      const priceNum = parseFloat(formData.price);

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
        contact_url: formData.contact_url || null
      };

      const { error } = await supabase
        .from('marketplace_scripts')
        .update(payload)
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) {
        toast.error(`Error updating: ${error.message}`);
      } else {
        toast.success('Script updated successfully!');
        router.push('/scripts/console');
      }
    } catch (err: any) {
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
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
              <Save className="text-indigo-600" />
              Edit Script
            </h1>
            <p className="text-gray-500 mt-1">Update your script details.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Basic Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Script Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description *</label>
                  <input required name="description" value={formData.description} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Long Description</label>
                  <textarea name="long_description" value={formData.long_description} onChange={handleChange} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
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
                    <input required name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" min="0" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
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
                  <input name="version" value={formData.version} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tags</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="React, Dashboard, Tailwind" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Key Features (One per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            {/* URLs & Files */}
            <div className="space-y-6 pt-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Media & Files</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail Image URL</label>
                  <input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Live Preview URL</label>
                  <input name="preview_url" value={formData.preview_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <Github size={20} /> GitHub Source Repository
                  </h3>
                  <input name="github_repo_url" value={formData.github_repo_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="font-bold text-green-900 flex items-center gap-2 mb-2">
                    <Send size={20} /> Contact & Support URL
                  </h3>
                  <input name="contact_url" value={formData.contact_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
              <Link href="/scripts/console" className="px-6 py-2.5 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </Link>
              <button disabled={loading} type="submit" className="px-8 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
