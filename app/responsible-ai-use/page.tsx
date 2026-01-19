'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import Icon from '@/components/ui/AppIcon';

interface EthicalPrinciple {
  icon: string;
  title: string;
  description: string;
  commitment: string;
}

interface AILimitation {
  icon: string;
  title: string;
  description: string;
  guidance: string;
}

interface FeedbackMethodology {
  step: number;
  title: string;
  description: string;
  privacyNote: string;
}

const ResponsibleAIUsePage = () => {
  const [activeTab, setActiveTab] = useState<'principles' | 'testing' | 'methodology'>('principles');

  const ethicalPrinciples: EthicalPrinciple[] = [
    {
      icon: 'ScaleIcon',
      title: 'Fairness Across Demographics',
      description: 'Our AI coaching algorithms are designed to provide equitable feedback regardless of age, gender, ethnicity, accent, or background.',
      commitment: 'Regular audits ensure no demographic group receives systematically different coaching quality or success rates.'
    },
    {
      icon: 'EyeIcon',
      title: 'Transparency in Feedback Generation',
      description: 'We provide clear explanations of how AI analyzes interview responses and generates coaching recommendations.',
      commitment: 'Users can understand the reasoning behind every AI suggestion, with no "black box" decision-making.'
    },
    {
      icon: 'UserGroupIcon',
      title: 'Human Oversight in Coaching',
      description: 'AI recommendations are designed to augment, not replace, human judgment in career decisions.',
      commitment: 'Critical career decisions should always involve human reflection and professional guidance beyond AI assistance.'
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Privacy-Preserving Analysis',
      description: 'Interview transcription and analysis occur with strict data minimization and user control principles.',
      commitment: 'No audio recordings stored; transcriptions processed in real-time with immediate deletion after session ends.'
    }
  ];

  const aiLimitations: AILimitation[] = [
    {
      icon: 'ExclamationTriangleIcon',
      title: 'Context Understanding Boundaries',
      description: 'AI may not fully grasp nuanced industry-specific terminology, company culture fit, or complex interpersonal dynamics.',
      guidance: 'Use AI coaching as one input among many; seek human mentors for strategic career guidance.'
    },
    {
      icon: 'ChatBubbleLeftRightIcon',
      title: 'Non-Verbal Communication Gaps',
      description: 'Our audio-only transcription cannot analyze body language, facial expressions, or visual presentation elements.',
      guidance: 'Supplement AI feedback with video practice sessions and human coaching for comprehensive preparation.'
    },
    {
      icon: 'ClockIcon',
      title: 'Real-Time Processing Constraints',
      description: 'AI suggestions are generated within seconds but may occasionally lag during complex technical discussions.',
      guidance: 'Treat AI as a supportive tool, not a real-time script; develop your own authentic communication style.'
    },
    {
      icon: 'DocumentTextIcon',
      title: 'Resume-Job Description Matching',
      description: 'AI alignment is based on keyword matching and semantic similarity, not deep industry expertise.',
      guidance: 'Verify AI-suggested talking points align with your actual experience and the role\'s true requirements.'
    }
  ];

  const feedbackMethodology: FeedbackMethodology[] = [
    {
      step: 1,
      title: 'Audio Capture & Transcription',
      description: 'Deepgram AI transcribes interviewer questions in real-time with speaker diarization to separate voices.',
      privacyNote: 'Audio is processed in-memory only; no recordings are stored on servers.'
    },
    {
      step: 2,
      title: 'Context Retrieval',
      description: 'System retrieves your resume, job description, and technical stack to provide role-specific context.',
      privacyNote: 'Context data is encrypted at rest and only accessed during active interview sessions.'
    },
    {
      step: 3,
      title: 'Natural Language Processing',
      description: 'AI analyzes question intent, identifies key topics, and matches against your background and target role.',
      privacyNote: 'Processing occurs on secure cloud infrastructure with zero-knowledge architecture.'
    },
    {
      step: 4,
      title: 'Response Generation',
      description: 'AI generates suggested talking points, relevant examples from your experience, and structured answer frameworks.',
      privacyNote: 'Suggestions are personalized but never stored or used to train models on your data.'
    },
    {
      step: 5,
      title: 'User-Controlled Display',
      description: 'Suggestions appear in overlay or stealth console; you decide what to use, adapt, or ignore entirely.',
      privacyNote: 'No tracking of which suggestions you use; your interview performance data remains private.'
    }
  ];

  const diversityCommitments = [
    'Training data includes diverse interview scenarios across 20+ industries and 50+ countries',
    'Regular bias audits conducted by third-party AI ethics researchers every quarter',
    'Diverse team of AI developers, career coaches, and ethics advisors from underrepresented backgrounds',
    'Open feedback channels for users to report potential bias or unfair coaching patterns',
    'Continuous model retraining with fairness constraints and demographic parity objectives'
  ];

  const userEmpowermentTools = [
    {
      icon: 'ChatBubbleBottomCenterTextIcon',
      title: 'Feedback on AI Recommendations',
      description: 'Rate the relevance and quality of AI suggestions after each interview session.'
    },
    {
      icon: 'FlagIcon',
      title: 'Report Bias Incidents',
      description: 'Submit concerns about potentially biased or inappropriate AI coaching feedback.'
    },
    {
      icon: 'AdjustmentsHorizontalIcon',
      title: 'Customize AI Behavior',
      description: 'Adjust coaching style preferences, formality levels, and suggestion frequency.'
    },
    {
      icon: 'DocumentChartBarIcon',
      title: 'Transparency Reports',
      description: 'Access quarterly reports on AI performance metrics, bias testing, and improvement initiatives.'
    }
  ];

  const researchPartnerships = [
    { institution: 'MIT Media Lab', focus: 'AI Ethics & Algorithmic Fairness' },
    { institution: 'Stanford HAI', focus: 'Human-Centered AI Design' },
    { institution: 'Oxford Internet Institute', focus: 'AI Governance & Policy' },
    { institution: 'Carnegie Mellon HCII', focus: 'Human-Computer Interaction in Career Tech' }
  ];

      return (
    <div className="copilot-theme min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6">
            <Icon name="ShieldCheckIcon" size={20} variant="solid" />
            <span className="font-semibold text-sm">Ethical AI Development</span>
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary mb-6">
            Responsible AI Use & Transparency
          </h1>
          <p className="text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Our commitment to ethical AI development, algorithmic fairness, and transparent decision-making in career coaching technology.
          </p>
        </div>
      </section>

      {/* Ethical AI Framework */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              Our Ethical AI Framework
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Core principles guiding every aspect of our AI coaching technology development and deployment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {ethicalPrinciples.map((principle, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-8 hover:shadow-card transition-shadow duration-250">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name={principle.icon as any} size={24} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline text-xl font-semibold text-primary mb-3">
                      {principle.title}
                    </h3>
                    <p className="text-foreground/80 mb-4">
                      {principle.description}
                    </p>
                    <div className="bg-accent/5 border-l-4 border-accent p-4 rounded">
                      <p className="text-sm text-foreground/70">
                        <strong className="text-accent">Our Commitment:</strong> {principle.commitment}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simplified Bias Testing Summary */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-headline text-4xl font-bold text-primary mb-3">
              Ongoing Algorithmic Audits
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              We test for fairness and bias every release, and we publish details with customers on request.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg text-primary mb-2">What we test</h3>
              <p className="text-sm text-foreground/80">
                Transcription consistency across accents, fair prompt quality across demographic inputs, and answer templates that avoid stereotype reinforcement.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg text-primary mb-2">How we report</h3>
              <p className="text-sm text-foreground/80">
                Internal scorecards are reviewed quarterly. If you need specifics, contact us and we will share the latest audit summary under NDA.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg text-primary mb-2">Human oversight</h3>
              <p className="text-sm text-foreground/80">
                Humans review edge cases; high-risk prompts are suppressed; user feedback drives retraining priorities before rollout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Limitations Disclosure */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              Understanding AI Limitations
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Transparent disclosure of coaching boundaries and the importance of human judgment in career decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aiLimitations.map((limitation, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Icon name={limitation.icon as any} size={20} className="text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-primary mb-2">
                      {limitation.title}
                    </h3>
                    <p className="text-sm text-foreground/70 mb-3">
                      {limitation.description}
                    </p>
                    <div className="bg-primary/5 p-3 rounded">
                      <p className="text-xs text-foreground/70">
                        <strong className="text-primary">Guidance:</strong> {limitation.guidance}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-accent/5 border-l-4 border-accent p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="LightBulbIcon" size={24} className="text-accent mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-primary mb-2">Human Judgment Remains Essential</h3>
                <p className="text-foreground/70">
                  Interview Copilot is designed to augment your preparation, not replace critical thinking. Career decisions should always involve personal reflection, professional mentorship, and consideration of factors AI cannot fully understand—such as company culture fit, long-term career goals, and personal values alignment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Methodology */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              How AI Analyzes & Generates Feedback
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Visual breakdown of our AI coaching methodology with privacy protections at every step.
            </p>
          </div>

          <div className="relative">
            {feedbackMethodology.map((step, index) => (
              <div key={index} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.step}
                  </div>
                  {index < feedbackMethodology.length - 1 && (
                    <div className="w-1 h-full bg-primary/20 mt-2" />
                  )}
                </div>
                <div className="flex-1 bg-card border border-border rounded-xl p-6 mb-8">
                  <h3 className="font-headline text-xl font-semibold text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-foreground/80 mb-4">
                    {step.description}
                  </p>
                  <div className="flex items-start gap-2 bg-success/5 p-3 rounded">
                    <Icon name="LockClosedIcon" size={16} className="text-success mt-1" />
                    <p className="text-sm text-foreground/70">
                      <strong className="text-success">Privacy:</strong> {step.privacyNote}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diversity & Inclusion Commitments */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              Diversity & Inclusion in AI Development
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Our ongoing efforts to eliminate bias and promote fairness in coaching algorithms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diversityCommitments.map((commitment, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Icon name="CheckCircleIcon" size={20} className="text-success mt-1" variant="solid" />
                  <p className="text-foreground/80">{commitment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Empowerment Tools */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              User Empowerment & Feedback
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Tools that give you control over AI recommendations and help us improve fairness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userEmpowermentTools.map((tool, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-card transition-shadow duration-250">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={tool.icon as any} size={24} className="text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-primary mb-2">{tool.title}</h3>
                <p className="text-sm text-foreground/70">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Partnerships */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold text-primary mb-4">
              Academic Research Partnerships
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Collaborating with leading institutions to advance responsible AI in career technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {researchPartnerships.map((partner, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="AcademicCapIcon" size={24} className="text-secondary" />
                </div>
                <h3 className="font-semibold text-primary mb-2">{partner.institution}</h3>
                <p className="text-sm text-foreground/70">{partner.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Reports CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <Icon name="DocumentTextIcon" size={48} className="text-primary mx-auto mb-6" />
          <h2 className="font-headline text-3xl font-bold text-primary mb-4">
            Quarterly Transparency Reports
          </h2>
          <p className="text-lg text-foreground/70 mb-8">
            Access detailed reports on AI performance metrics, bias mitigation efforts, and ethical review processes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="font-cta px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-250">
              View Latest Report (Q1 2026)
            </button>
            <button className="font-cta px-8 py-4 bg-card border border-border text-primary rounded-lg font-semibold hover:bg-muted/30 transition-colors duration-250">
              Report Archive
            </button>
          </div>
        </div>
      </section>

      {/* Community Feedback Integration */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-8">
              <Icon name="ChatBubbleLeftEllipsisIcon" size={40} className="text-accent mx-auto mb-4" />
              <h2 className="font-headline text-3xl font-bold text-primary mb-4">
                Your Feedback Shapes Our AI
              </h2>
              <p className="text-lg text-foreground/70">
                We actively integrate user feedback into AI improvement initiatives. Report concerns, suggest improvements, or share your experience.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <button className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors duration-250 text-center">
                <Icon name="FlagIcon" size={24} className="text-warning mx-auto mb-2" />
                <div className="font-semibold text-primary">Report Bias</div>
              </button>
              <button className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors duration-250 text-center">
                <Icon name="LightBulbIcon" size={24} className="text-secondary mx-auto mb-2" />
                <div className="font-semibold text-primary">Suggest Improvement</div>
              </button>
              <button className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors duration-250 text-center">
                <Icon name="ChatBubbleBottomCenterTextIcon" size={24} className="text-success mx-auto mb-2" />
                <div className="font-semibold text-primary">Share Experience</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResponsibleAIUsePage;
