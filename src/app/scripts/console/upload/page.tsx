'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToGitHub } from '@/lib/github-assets';
import { ArrowLeft, Upload, Loader2, Github, CheckCircle2, Send, X, Image, Eye, EyeOff, HelpCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'zetsumarket_upload_draft';

const defaultFormData = {
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
};

export default function UploadScriptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Load saved form data from localStorage
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultFormData, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return defaultFormData;
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(-1);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof defaultFormData) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: typeof defaultFormData) => ({ ...prev, show_readme: e.target.checked }));
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(defaultFormData);
    setScreenshots([]);
    setScreenshotPreviews([]);
    toast.success('Draft cleared');
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (screenshots.length + files.length > 8) {
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

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be logged in to upload scripts.');
      return;
    }

    setLoading(true);
    setUploadPercent(0);

    try {
      const featuresArray = formData.features.split('\n').filter((f: string) => f.trim() !== '');
      const tagsArray = formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
      const priceNum = parseFloat(formData.price);
      const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';

      // Upload screenshots to GitHub
      const screenshotUrls: string[] = [];
      if (screenshots.length > 0) {
        for (let i = 0; i < screenshots.length; i++) {
          setUploadingScreenshot(i);
          setUploadProgress(`Uploading screenshot ${i + 1} of ${screenshots.length}...`);
          setUploadPercent(Math.round(((i + 0.5) / screenshots.length) * 80));

          const base64 = await fileToBase64(screenshots[i]);
          const result = await uploadToGitHub(base64, 'marketplace/screenshots', `${user.id}-${Date.now()}-${i}.jpg`);
          screenshotUrls.push(result.url);

          setUploadPercent(Math.round(((i + 1) / screenshots.length) * 80));
        }
        setUploadingScreenshot(-1);
      }

      setUploadProgress('Saving to database...');
      setUploadPercent(90);

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
        screenshots: screenshotUrls.length > 0 ? screenshotUrls : [],
        show_readme: formData.show_readme,
        author_id: user.id,
        author_name: authorName,
        status: 'Active'
      };

      // Clean up empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      setUploadPercent(95);

      const { error } = await supabase.from('marketplace_scripts').insert([payload]);

      if (error) {
        console.error("Upload error details:", JSON.stringify(error, null, 2));
        toast.error(`Error uploading: ${error.message || error.details || 'Unknown error'}`);
      } else {
        setUploadPercent(100);
        setUploadProgress('Done!');
        localStorage.removeItem(STORAGE_KEY);
        toast.success("Script published successfully!");
        setSuccess(true);
        setTimeout(() => {
          router.push('/scripts/console');
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
      setUploadProgress('');
      setUploadPercent(0);
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
                  <input required name="description" value={formData.description} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="A brief summary for the script card" />
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
                  <input name="tags" value={formData.tags} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="React, Dashboard, Tailwind" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Key Features (One per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Fully Responsive&#10;Dark Mode Support&#10;Clean Code" />
                </div>
              </div>
            </div>

            {/* Media & Files */}
            <div className="space-y-6 pt-4">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Media & Files</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail Image URL</label>
                  <input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://example.com/image.jpg" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Live Preview URL</label>
                  <input name="preview_url" value={formData.preview_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://my-script-demo.com" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Video URL (YouTube or Vimeo)</label>
                  <input name="video_url" value={formData.video_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://youtube.com/watch?v=..." />
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
                    Paste the direct download link to your script ZIP file. Buyers will download from this URL after purchase.
                  </p>
                  <input name="download_url" value={formData.download_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://drive.google.com/uc?id=..." />

                  {/* Tutorial */}
                  {showTutorial && (
                    <div className="mt-4 bg-white rounded-lg border border-purple-200 p-4 text-sm">
                      <h4 className="font-bold text-gray-900 mb-3">How to upload your ZIP and get a download URL:</h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">1</span>
                          <div>
                            <p className="font-medium text-gray-900">Google Drive (Recommended - Free)</p>
                            <p className="text-gray-600 mt-1">Upload your ZIP to Google Drive, right-click, select "Share", set to "Anyone with the link", then copy the link.</p>
                            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline mt-1 inline-flex items-center gap-1">
                              Open Google Drive <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">2</span>
                          <div>
                            <p className="font-medium text-gray-900">GitHub Releases (Free)</p>
                            <p className="text-gray-600 mt-1">Create a release on your repo, attach the ZIP file, then copy the download URL from the release.</p>
                            <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline mt-1 inline-flex items-center gap-1">
                              Create GitHub Release <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs shrink-0">3</span>
                          <div>
                            <p className="font-medium text-gray-900">Dropbox (Free)</p>
                            <p className="text-gray-600 mt-1">Upload to Dropbox, click "Share", create a link, then change "dl=0" to "dl=1" at the end of the URL.</p>
                            <a href="https://dropbox.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline mt-1 inline-flex items-center gap-1">
                              Open Dropbox <ExternalLink size={12} />
                            </a>
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
                  <p className="text-sm text-blue-700 mb-4">
                    Upload screenshots of your script. These will be shown in the product gallery.
                  </p>
                  <input ref={screenshotInputRef} type="file" accept="image/*" multiple onChange={handleScreenshotSelect} className="hidden" />
                  {screenshotPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {screenshotPreviews.map((preview, index) => (
                        <div key={index} className={`relative group ${uploadingScreenshot === index ? 'animate-pulse' : ''}`}>
                          <img
                            src={preview}
                            alt={`Screenshot ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 transition-all ${
                              uploadingScreenshot === index
                                ? 'border-blue-400 opacity-60 blur-[2px]'
                                : 'border-blue-200'
                            }`}
                          />
                          {uploadingScreenshot === index && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 size={20} className="animate-spin text-blue-600" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {screenshots.length < 8 && (
                    <button
                      type="button"
                      onClick={() => screenshotInputRef.current?.click()}
                      className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Image size={18} />
                      Add Screenshots ({screenshots.length}/8)
                    </button>
                  )}
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                  <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <Github size={20} /> GitHub Source Repository
                  </h3>
                  <input name="github_repo_url" value={formData.github_repo_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://github.com/username/my-awesome-script" />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="font-bold text-green-900 flex items-center gap-2 mb-2">
                    <Send size={20} /> Contact & Support URL
                  </h3>
                  <input name="contact_url" value={formData.contact_url} onChange={handleChange} type="url" className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="https://discord.gg/your-server" />
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

            <div className="pt-6 border-t border-gray-200 flex justify-between">
              <button type="button" onClick={clearDraft} className="px-4 py-2.5 rounded-lg font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm">
                Clear Draft
              </button>
              <div className="flex gap-4">
                <Link href="/scripts/console" className="px-6 py-2.5 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </Link>
                <button disabled={loading} type="submit" className="px-8 py-2.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  Publish Script
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
