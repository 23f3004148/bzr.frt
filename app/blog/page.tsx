'use client';

import { useEffect, useState } from 'react';

import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { fetchBlogPosts, resolveMediaUrl } from '@/services/backendApi';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    role: string;
    image: string;
    alt: string;
  };
  readTime: number;
  publishedDate: string;
  image: string;
  alt: string;
  shares: number;
  comments: number;
  featured?: boolean;
}

const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);

  const categories = [
  { name: 'All', icon: 'Squares2X2Icon', color: 'bg-blue-500' },
  { name: 'Interview Mastery', icon: 'AcademicCapIcon', color: 'bg-purple-500' },
  { name: 'Career Growth', icon: 'ChartBarIcon', color: 'bg-green-500' },
  { name: 'AI & Future of Work', icon: 'CpuChipIcon', color: 'bg-orange-500' },
  { name: 'Success Stories', icon: 'TrophyIcon', color: 'bg-yellow-500' }];


  const seedArticles: Article[] = [
  {
    id: '1',
    title: 'How AI is Revolutionizing Technical Interview Preparation',
    excerpt: 'Discover how artificial intelligence is transforming the way candidates prepare for technical interviews, with real-time feedback and personalized coaching strategies.',
    category: 'AI & Future of Work',
    author: {
      name: 'Dr. Sarah Chen',
      role: 'AI Research Lead',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1e0c92dc3-1763298745461.png",
      alt: 'Dr. Sarah Chen, AI Research Lead with expertise in machine learning'
    },
    readTime: 8,
    publishedDate: '2026-01-02',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_15f52ba97-1765651105666.png",
    alt: 'AI technology interface showing real-time interview coaching dashboard',
    shares: 342,
    comments: 28,
    featured: true
  },
  {
    id: '2',
    title: 'From Rejection to Offer: A Senior Engineer\'s Journey',
    excerpt: 'Read how Michael transformed 15 rejections into 3 FAANG offers using strategic preparation and AI-powered interview coaching.',
    category: 'Success Stories',
    author: {
      name: 'Michael Rodriguez',
      role: 'Senior Software Engineer at Google',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_13c686c1a-1763295142635.png",
      alt: 'Michael Rodriguez, Senior Software Engineer sharing his success story'
    },
    readTime: 12,
    publishedDate: '2025-12-28',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_175115bcb-1764706023945.png",
    alt: 'Professional team celebrating success in modern office environment',
    shares: 567,
    comments: 45,
    featured: true
  },
  {
    id: '3',
    title: 'Mastering System Design Interviews: A Complete Guide',
    excerpt: 'Learn the frameworks and strategies top engineers use to ace system design interviews at leading tech companies.',
    category: 'Interview Mastery',
    author: {
      name: 'Alex Kumar',
      role: 'Staff Engineer at Meta',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_10435b657-1763293369580.png",
      alt: 'Alex Kumar, Staff Engineer with system design expertise'
    },
    readTime: 15,
    publishedDate: '2025-12-25',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_13f18a618-1767526626017.png",
    alt: 'System architecture diagram on whiteboard during technical interview',
    shares: 892,
    comments: 67
  },
  {
    id: '4',
    title: 'Career Transition: From Bootcamp to Six-Figure Salary',
    excerpt: 'How Emma leveraged AI coaching to transition from a coding bootcamp graduate to landing a $120K role in just 6 months.',
    category: 'Career Growth',
    author: {
      name: 'Emma Thompson',
      role: 'Career Coach & Former Recruiter',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b4ba176d-1763299448537.png",
      alt: 'Emma Thompson, experienced career coach and recruiter'
    },
    readTime: 10,
    publishedDate: '2025-12-20',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1f37c85dd-1765892762372.png",
    alt: 'Career growth concept with upward trending graph and laptop',
    shares: 423,
    comments: 34
  },
  {
    id: '5',
    title: 'The Psychology of Interview Confidence: Science-Backed Tips',
    excerpt: 'Explore research-backed techniques to manage interview anxiety and project confidence during high-stakes conversations.',
    category: 'Interview Mastery',
    author: {
      name: 'Dr. James Park',
      role: 'Organizational Psychologist',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_14cb65c32-1763295647538.png",
      alt: 'Dr. James Park, organizational psychologist specializing in performance'
    },
    readTime: 7,
    publishedDate: '2025-12-15',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_15d2a9fd8-1766579738484.png",
    alt: 'Confident professional in interview setting with positive body language',
    shares: 678,
    comments: 52
  },
  {
    id: '6',
    title: 'Remote Interview Best Practices for 2026',
    excerpt: 'Essential tips for excelling in virtual interviews, from technical setup to building rapport through a screen.',
    category: 'Interview Mastery',
    author: {
      name: 'Lisa Wang',
      role: 'Remote Work Consultant',
      image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b96807b8-1763296753718.png",
      alt: 'Lisa Wang, remote work consultant and interview expert'
    },
    readTime: 6,
    publishedDate: '2025-12-10',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_13fc1db54-1767094596876.png",
    alt: 'Professional remote interview setup with proper lighting and background',
    shares: 234,
    comments: 19
  }];

  useEffect(() => {
    setArticles(seedArticles);
    fetchBlogPosts()
      .then((posts: any[]) => {
        if (Array.isArray(posts) && posts.length) {
          const mapped = posts.map((p) => ({
            id: String(p._id || p.id || Math.random()),
            title: p.title,
            excerpt: p.content || '',
            category: (p.tags && p.tags[0]) || (p.status === 'featured' ? 'Featured' : 'Latest'),
            author: {
              name: 'BUUZZER Editorial',
              role: 'Interview Copilot',
              image: resolveMediaUrl(p.heroImage) || seedArticles[0].author.image,
              alt: p.title,
            },
            readTime: 6,
            publishedDate: p.createdAt || new Date().toISOString(),
            image: resolveMediaUrl(p.heroImage) || seedArticles[0].image,
            alt: p.title,
            shares: 0,
            comments: 0,
            featured: p.status === 'featured',
          }));
          setArticles(mapped);
        }
      })
      .catch(() => setArticles(seedArticles));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const trendingArticles = articles.slice(0, 3);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <div className="copilot-theme min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="font-headline text-5xl font-bold text-foreground mb-4">
              Interview Insights & Career Growth
            </h1>
            <p className="font-body text-xl text-muted-foreground max-w-3xl mx-auto">
              Expert advice, success stories, and industry insights to help you ace interviews and advance your career.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Icon name="MagnifyingGlassIcon" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles, topics, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />

            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) =>
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category.name ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-muted text-muted-foreground hover:bg-muted/80'}`
              }>

                <Icon name={category.icon as any} size={18} />
                {category.name}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Articles Grid */}
            <div className="lg:col-span-2">
              {/* Featured Articles */}
              {selectedCategory === 'All' &&
              <div className="mb-12">
                  <h2 className="font-headline text-3xl font-bold text-foreground mb-6">Featured Articles</h2>
                  <div className="grid gap-6">
                    {articles.filter((a) => a.featured).map((article) =>
                  <div key={article.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="relative h-64 md:h-auto">
                            <img src={article.image} alt={article.alt} className="w-full h-full object-cover" />
                            <span className="absolute top-4 left-4 px-3 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                              Featured
                            </span>
                          </div>
                          <div className="p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                                  {article.category}
                                </span>
                                <span className="text-sm text-muted-foreground">{article.readTime} min read</span>
                              </div>
                              <h3 className="font-headline text-2xl font-bold text-foreground mb-3 hover:text-primary transition-colors">
                                {article.title}
                              </h3>
                              <p className="font-body text-muted-foreground mb-4">{article.excerpt}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={article.author.image} alt={article.author.alt} className="w-10 h-10 rounded-full" />
                                <div>
                                  <p className="font-medium text-foreground text-sm">{article.author.name}</p>
                                  <p className="text-xs text-muted-foreground">{article.author.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Icon name="ShareIcon" size={16} />
                                  {article.shares}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Icon name="ChatBubbleLeftIcon" size={16} />
                                  {article.comments}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              }

              {/* All Articles */}
              <div>
                <h2 className="font-headline text-3xl font-bold text-foreground mb-6">
                  {selectedCategory === 'All' ? 'Latest Articles' : selectedCategory}
                </h2>
                <div className="grid gap-6">
                  {filteredArticles.map((article) =>
                  <div key={article.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="relative h-48 md:h-auto">
                          <img src={article.image} alt={article.alt} className="w-full h-full object-cover" />
                        </div>
                        <div className="md:col-span-2 p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                              {article.category}
                            </span>
                            <span className="text-sm text-muted-foreground">{article.readTime} min read</span>
                          </div>
                          <h3 className="font-headline text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="font-body text-muted-foreground mb-4">{article.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={article.author.image} alt={article.author.alt} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-medium text-foreground text-sm">{article.author.name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="ShareIcon" size={16} />
                                {article.shares}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="ChatBubbleLeftIcon" size={16} />
                                {article.comments}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Newsletter Subscription */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
                <h3 className="font-headline text-2xl font-bold mb-3">Stay Updated</h3>
                <p className="font-body mb-4 opacity-90">
                  Get the latest interview tips and career insights delivered to your inbox.
                </p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-primary-foreground placeholder:text-primary-foreground/70 focus:outline-none focus:ring-2 focus:ring-white/50" />

                  <button
                    type="submit"
                    disabled={subscribed}
                    className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50">

                    {subscribed ? '✓ Subscribed!' : 'Subscribe Now'}
                  </button>
                </form>
              </div>

              {/* Trending Articles */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-headline text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="FireIcon" size={24} className="text-orange-500" />
                  Trending Now
                </h3>
                <div className="space-y-4">
                  {trendingArticles.map((article, index) =>
                  <div key={article.id} className="flex gap-3 group cursor-pointer">
                      <span className="font-headline text-3xl font-bold text-muted-foreground/30 group-hover:text-primary transition-colors">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{article.readTime} min read</span>
                          <span>•</span>
                          <span>{article.shares} shares</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories Widget */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-headline text-xl font-bold text-foreground mb-4">Browse by Topic</h3>
                <div className="space-y-2">
                  {categories.filter((c) => c.name !== 'All').map((category) =>
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left">

                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${category.color}`} />
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                      <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default BlogPage;
