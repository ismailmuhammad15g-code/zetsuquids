'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToGitHub } from '@/lib/github-assets';
import { ArrowLeft, Upload, Github, CheckCircle2, Send, X, Image, Eye, EyeOff, HelpCircle, ExternalLink } from 'lucide-react';
import Loading from '@/components/scripts/Loading';
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
  extended_price: '',
  show_readme: false
};

export default function UploadScriptPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);

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

      const extendedPriceNum = parseFloat(formData.extended_price);

      const payload: any = {
        title: formData.title,
        description: formData.description,
        long_description: formData.long_description || null,
        price: isNaN(priceNum) ? 0 : priceNum,
        extended_price: isNaN(extendedPriceNum) ? null : extendedPriceNum,
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fefefe]">
        <p className="text-[#636e72] mb-6 text-sm">Please log in to access this page.</p>
        <Link href="/auth" className="bg-[#2d3436] text-[#fefefe] px-6 py-2 rounded-[2px] font-medium text-sm hover:bg-[#636e72] transition-colors">Login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fefefe] flex items-center justify-center p-4">
        <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] border border-[#c8b6a6]/20 p-8 max-w-md w-full text-center">
          <CheckCircle2 size={48} className="mx-auto text-[#636e72] mb-4" />
          <h2 className="font-heading text-lg font-semibold text-[#2d3436] mb-2">Upload Successful!</h2>
          <p className="text-[#636e72] text-sm mb-6">Your script has been published to the marketplace.</p>
          <Loading size={48} />
          <p className="text-xs text-[#636e72]/60 mt-2">Redirecting to console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefefe] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link href="/scripts/console" className="inline-flex items-center gap-2 text-[#c8b6a6] hover:text-[#2d3436] font-medium mb-6 transition-colors text-sm">
          <ArrowLeft size={14} /> Back to Console
        </Link>

        <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 overflow-hidden">
          <div className="border-b border-[#c8b6a6]/15 bg-[#f8f6f4] px-8 py-6">
            <h1 className="font-heading text-lg font-semibold text-[#2d3436] flex items-center gap-2">
              <Upload className="text-[#636e72]" size={18} />
              Upload New Script
            </h1>
            <p className="text-[#636e72] text-sm mt-1">Fill out the details to list your code on ZetsuMarket.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* Basic Info */}
            <div className="space-y-6">
              <h2 className="font-heading text-sm font-semibold text-[#2d3436] border-b border-[#c8b6a6]/10 pb-2">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Script Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="e.g. Ultimate React Admin Dashboard" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Short Description *</label>
                  <input required name="description" value={formData.description} onChange={handleChange} type="text" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="A brief summary for the script card" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Long Description</label>
                  <textarea name="long_description" value={formData.long_description} onChange={handleChange} rows={5} className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="Detailed description of what your script does..." />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Category *</label>
                  <select required name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] transition-all">
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
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Regular Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72] font-medium text-sm">$</span>
                    <input required name="price" value={formData.price} onChange={handleChange} type="number" step="0.01" min="0" className="w-full pl-8 pr-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="19.99" />
                  </div>
                  <p className="text-[11px] text-[#636e72]/60 mt-1">For personal use, end users not charged.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Extended Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72] font-medium text-sm">$</span>
                    <input name="extended_price" value={formData.extended_price} onChange={handleChange} type="number" step="0.01" min="0" className="w-full pl-8 pr-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="99.00" />
                  </div>
                  <p className="text-[11px] text-[#636e72]/60 mt-1">For commercial use, end users can be charged.</p>
                </div>
              </div>
            </div>

            {/* Details & Features */}
            <div className="space-y-6 pt-4">
              <h2 className="font-heading text-sm font-semibold text-[#2d3436] border-b border-[#c8b6a6]/10 pb-2">Technical Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Version</label>
                  <input name="version" value={formData.version} onChange={handleChange} type="text" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="1.0.0" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Tags</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} type="text" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="React, Dashboard, Tailwind" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Key Features (One per line)</label>
                  <textarea name="features" value={formData.features} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="Fully Responsive&#10;Dark Mode Support&#10;Clean Code" />
                </div>
              </div>
            </div>

            {/* Media & Files */}
            <div className="space-y-6 pt-4">
              <h2 className="font-heading text-sm font-semibold text-[#2d3436] border-b border-[#c8b6a6]/10 pb-2">Media & Files</h2>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Thumbnail Image URL</label>
                  <input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://example.com/image.jpg" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Live Preview URL</label>
                  <input name="preview_url" value={formData.preview_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://my-script-demo.com" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#636e72] mb-1.5">Video URL (YouTube or Vimeo)</label>
                  <input name="video_url" value={formData.video_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://youtube.com/watch?v=..." />
                </div>

                {/* Download URL */}
                <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-semibold text-[#2d3436] text-sm flex items-center gap-2">
                      <ExternalLink size={16} /> Script Download URL
                    </h3>
                    <button type="button" onClick={() => setShowTutorial(!showTutorial)} className="text-[#c8b6a6] hover:text-[#2d3436] flex items-center gap-1 text-xs font-medium transition-colors">
                      <HelpCircle size={14} />
                      How to get URL?
                    </button>
                  </div>
                  <p className="text-xs text-[#636e72] mb-4">
                    Paste the direct download link to your script ZIP file. Buyers will download from this URL after purchase.
                  </p>
                  <input name="download_url" value={formData.download_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://drive.google.com/uc?id=..." />

                  {showTutorial && (
                    <div className="mt-4 bg-[#fefefe] rounded-[2px] border border-[#c8b6a6]/20 p-4 text-xs">
                      <h4 className="font-medium text-[#2d3436] mb-3">How to upload your ZIP and get a download URL:</h4>
                      <div className="space-y-3">
                        {[
                          { num: '1', title: 'Google Drive (Recommended - Free)', desc: 'Upload your ZIP to Google Drive, right-click, select "Share", set to "Anyone with the link", then copy the link.', url: 'https://drive.google.com', urlText: 'Open Google Drive' },
                          { num: '2', title: 'GitHub Releases (Free)', desc: 'Create a release on your repo, attach the ZIP file, then copy the download URL from the release.', url: 'https://github.com/new', urlText: 'Create GitHub Release' },
                          { num: '3', title: 'Dropbox (Free)', desc: 'Upload to Dropbox, click "Share", create a link, then change "dl=0" to "dl=1" at the end of the URL.', url: 'https://dropbox.com', urlText: 'Open Dropbox' },
                        ].map(item => (
                          <div key={item.num} className="flex items-start gap-3">
                            <span className="bg-[#c8b6a6]/20 text-[#2d3436] font-medium px-1.5 py-0.5 rounded-[2px] text-[10px] shrink-0">{item.num}</span>
                            <div>
                              <p className="font-medium text-[#2d3436]">{item.title}</p>
                              <p className="text-[#636e72] mt-0.5">{item.desc}</p>
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#c8b6a6] hover:text-[#2d3436] mt-1 inline-flex items-center gap-1 transition-colors">
                                {item.urlText} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshots Upload */}
                <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-6">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm flex items-center gap-2 mb-2">
                    <Image size={16} /> Screenshots (Max 8)
                  </h3>
                  <p className="text-xs text-[#636e72] mb-4">
                    Upload screenshots of your script. These will be shown in the product gallery.
                  </p>
                  <input ref={screenshotInputRef} type="file" accept="image/*" multiple onChange={handleScreenshotSelect} className="hidden" />
                  {screenshotPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {screenshotPreviews.map((preview, index) => (
                        <div key={index} className={`relative group ${uploadingScreenshot === index ? 'animate-pulse' : ''}`}>
                          <img
                            src={preview}
                            alt={`Screenshot ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-[2px] border transition-all ${
                              uploadingScreenshot === index
                                ? 'border-[#c8b6a6] opacity-60 blur-[2px]'
                                : 'border-[#c8b6a6]/20'
                            }`}
                          />
                          {uploadingScreenshot === index && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loading size={16} />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="absolute top-1 right-1 bg-[#2d3436] text-[#fefefe] rounded-[2px] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {screenshots.length < 8 && (
                    <button
                      type="button"
                      onClick={() => screenshotInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-[#c8b6a6]/40 rounded-[2px] text-[#636e72] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-xs"
                    >
                      <Image size={14} />
                      Add Screenshots ({screenshots.length}/8)
                    </button>
                  )}
                </div>

                <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-6">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm flex items-center gap-2 mb-2">
                    <Github size={16} /> GitHub Source Repository
                  </h3>
                  <input name="github_repo_url" value={formData.github_repo_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://github.com/username/my-awesome-script" />
                </div>

                <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-6">
                  <h3 className="font-heading font-semibold text-[#2d3436] text-sm flex items-center gap-2 mb-2">
                    <Send size={16} /> Contact & Support URL
                  </h3>
                  <input name="contact_url" value={formData.contact_url} onChange={handleChange} type="url" className="w-full px-4 py-2.5 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none text-sm bg-[#fefefe] placeholder-[#636e72]/40 transition-all" placeholder="https://discord.gg/your-server" />
                </div>

                {/* README Toggle */}
                <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {formData.show_readme ? <Eye size={16} className="text-[#636e72]" /> : <EyeOff size={16} className="text-[#636e72]/40" />}
                      <div>
                        <h3 className="font-heading font-semibold text-[#2d3436] text-sm">Show README in Details</h3>
                        <p className="text-[11px] text-[#636e72]">If your script has a README, it will be shown in the product details page.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.show_readme} onChange={handleCheckboxChange} className="sr-only peer" />
                      <div className="w-10 h-5 bg-[#c8b6a6]/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#fefefe] after:border-[#c8b6a6]/30 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2d3436]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {loading && (
              <div className="bg-[#f8f6f4] border border-[#c8b6a6]/20 rounded-[2px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Loading size={16} />
                    <p className="text-[#2d3436] font-medium text-sm">{uploadProgress || 'Preparing...'}</p>
                  </div>
                  <span className="text-[#2d3436] font-heading font-semibold text-sm">{uploadPercent}%</span>
                </div>
                <div className="w-full bg-[#c8b6a6]/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2d3436] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[#c8b6a6]/10 flex justify-between">
              <button type="button" onClick={clearDraft} className="px-4 py-2.5 rounded-[2px] font-medium text-[#636e72] hover:text-[#2d3436] hover:bg-[#f8f6f4] transition-colors text-xs">
                Clear Draft
              </button>
              <div className="flex gap-3">
                <Link href="/scripts/console" className="px-6 py-2.5 rounded-[2px] font-medium text-[#636e72] bg-[#f8f6f4] hover:bg-[#fefefe] transition-colors text-sm border border-[#c8b6a6]/20">
                  Cancel
                </Link>
                <button disabled={loading} type="submit" className="px-8 py-2.5 rounded-[2px] font-medium text-[#fefefe] bg-[#2d3436] hover:bg-[#636e72] transition-colors flex items-center gap-2 disabled:opacity-50 text-sm">
                  {loading ? <Loading size={16} /> : <Upload size={16} />}
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
