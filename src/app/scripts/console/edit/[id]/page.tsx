'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToGitHub } from '@/lib/github-assets';
import { ArrowLeft, Save, Loader2, Github, Send, X, Image, Eye, EyeOff, HelpCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function EditScriptPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);

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
    contact_url: '',
    video_url: '',
    download_url: '',
    show_readme: false
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [existingScreenshots, setExistingScreenshots] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(-1);

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
        contact_url: data.contact_url || '',
        video_url: data.video_url || '',
        download_url: data.download_url || '',
        show_readme: data.show_readme || false
      });

      setExistingScreenshots(Array.isArray(data.screenshots) ? data.screenshots : []);
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, show_readme: e.target.checked }));
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalScreenshots = existingScreenshots.length + screenshots.length + files.length;
    if (totalScreenshots > 8) {
      toast.error('Maximum 8 screenshots allowed');
      return;
    }
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    setScreenshots(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingScreenshots(prev => prev.filter((_, i) => i !== index));
    } else {
      setScreenshots(prev => prev.filter((_, i) => i !== index));
      setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be logged in.');
      return;
    }

    setLoading(true);
    setUploadPercent(0);

    try {
      const featuresArray = formData.features.split('\n').filter((f: string) => f.trim() !== '');
      const tagsArray = formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
      const priceNum = parseFloat(formData.price);

      // Upload new screenshots
      const newScreenshotUrls: string[] = [];
      if (screenshots.length > 0) {
        for (let i = 0; i < screenshots.length; i++) {
          setUploadingScreenshot(i);
          setUploadProgress(`Uploading screenshot ${i + 1} of ${screenshots.length}...`);
          setUploadPercent(Math.round(((i + 0.5) / screenshots.length) * 80));

          const base64 = await fileToBase64(screenshots[i]);
          const result = await uploadToGitHub(base64, 'marketplace/screenshots', `${user.id}-${Date.now()}-${i}.jpg`);
          newScreenshotUrls.push(result.url);

          setUploadPercent(Math.round(((i + 1) / screenshots.length) * 80));
        }
        setUploadingScreenshot(-1);
      }

      setUploadProgress('Saving to database...');
      setUploadPercent(90);

      const allScreenshots = [...existingScreenshots, ...newScreenshotUrls];

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
        contact_url: formData.contact_url || null,
        video_url: formData.video_url || null,
        download_url: formData.download_url || null,
        screenshots: allScreenshots.length > 0 ? allScreenshots : [],
        show_readme: formData.show_readme
      };

      setUploadPercent(95);

      const { error } = await supabase
        .from('marketplace_scripts')
        .update(payload)
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) {
        toast.error(`Error updating: ${error.message}`);
      } else {
        setUploadPercent(100);
        setUploadProgress('Done!');
        toast.success('Script updated successfully!');
        router.push('/scripts/console');
      }
    } catch (err: any) {
      toast.error(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadProgress('');
      setUploadPercent(0);
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

            {/* Media & Files */}
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Video URL (YouTube or Vimeo)</label>
                  <input name="video_url" value={formData.video_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                {/* Download URL */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      <ExternalLink size={20} /> Script Download URL
                    </h3>
                    <button type="button" onClick={() => setShowTutorial(!showTutorial)} className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                      <HelpCircle size={16} />
                      How to get URL?
                    </button>
                  </div>
                  <p className="text-sm text-purple-700 mb-4">
                    Paste the direct download link to your script ZIP file.
                  </p>
                  <input name="download_url" value={formData.download_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://drive.google.com/uc?id=..." />

                  {showTutorial && (
                    <div className="mt-4 bg-white rounded-lg border border-purple-200 p-4 text-sm">
                      <h4 className="font-bold text-gray-900 mb-3">How to upload your ZIP and get a download URL:</h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">1</span>
                          <div>
                            <p className="font-medium text-gray-900">Google Drive (Recommended)</p>
                            <p className="text-gray-600 mt-1">Upload ZIP, right-click, Share, "Anyone with link", copy link.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">2</span>
                          <div>
                            <p className="font-medium text-gray-900">GitHub Releases</p>
                            <p className="text-gray-600 mt-1">Create release, attach ZIP, copy download URL.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">3</span>
                          <div>
                            <p className="font-medium text-gray-900">Dropbox</p>
                            <p className="text-gray-600 mt-1">Upload, Share, create link, change dl=0 to dl=1.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshots Upload */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                    <Image size={20} /> Screenshots (Max 8)
                  </h3>
                  <input ref={screenshotInputRef} type="file" accept="image/*" multiple onChange={handleScreenshotSelect} className="hidden" />
                  {(existingScreenshots.length > 0 || screenshotPreviews.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {existingScreenshots.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-blue-200" />
                          <button type="button" onClick={() => removeScreenshot(index, true)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {screenshotPreviews.map((preview, index) => (
                        <div key={`new-${index}`} className={`relative group ${uploadingScreenshot === index ? 'animate-pulse' : ''}`}>
                          <img
                            src={preview}
                            alt={`New Screenshot ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 transition-all ${
                              uploadingScreenshot === index
                                ? 'border-blue-400 opacity-60 blur-[2px]'
                                : 'border-green-200'
                            }`}
                          />
                          {uploadingScreenshot === index && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 size={20} className="animate-spin text-blue-600" />
                            </div>
                          )}
                          <button type="button" onClick={() => removeScreenshot(index, false)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(existingScreenshots.length + screenshots.length) < 8 && (
                    <button type="button" onClick={() => screenshotInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                      <Image size={18} />
                      Add Screenshots ({existingScreenshots.length + screenshots.length}/8)
                    </button>
                  )}
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

                {/* README Toggle */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {formData.show_readme ? <Eye size={20} className="text-green-600" /> : <EyeOff size={20} className="text-gray-400" />}
                      <div>
                        <h3 className="font-bold text-gray-900">Show README in Details</h3>
                        <p className="text-sm text-gray-500">If your script has a README, it will be shown in the product details page.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.show_readme} onChange={handleCheckboxChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {loading && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-indigo-600" />
                    <p className="text-indigo-700 font-medium">{uploadProgress || 'Preparing...'}</p>
                  </div>
                  <span className="text-indigo-700 font-bold">{uploadPercent}%</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

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
