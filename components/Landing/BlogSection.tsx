import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppState, BlogPost } from '@/types';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { fetchBlogPosts, resolveMediaUrl } from '@/services/backendApi';

interface BlogSectionProps {
  onNavigate: (state: AppState) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onNavigate }) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchBlogPosts('featured')
      .then((posts) => setBlogPosts(Array.isArray(posts) ? posts : []))
      .catch(() => setBlogPosts([]));
  }, []);

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="section-label mb-4 inline-block">RESOURCES</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Latest from Our <span className="gradient-text">Blog</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Tips, strategies, and insights to help you prepare for your next interview.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate(AppState.BLOG)}
            className="self-start md:self-auto"
          >
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Blog Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => {
            const heroUrl = resolveMediaUrl(post.heroImage);
            return (
            <motion.article
              key={post.id || post._id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="blog-card group cursor-pointer"
              onClick={() => onNavigate(AppState.BLOG)}
            >
              {/* Image */}
              <div className="h-48 relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                {heroUrl ? (
                  <img src={heroUrl} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30" />
                )}
                <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/5 transition-colors" />
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium text-foreground">
                    <Tag className="w-3 h-3" />
                    {(post.tags && post.tags[0]) || post.status || 'Featured'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.content || 'Tap to read more'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'New'}</span>
                </div>
              </div>
            </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
