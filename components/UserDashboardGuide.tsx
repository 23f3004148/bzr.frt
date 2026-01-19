import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiCpu, FiHelpCircle, FiShield, FiType, FiUsers, FiZap } from 'react-icons/fi';

import { AppState } from '../types';
import { Button } from './Button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

type Props = {
  onNavigate: (s: AppState) => void;
};

export const UserDashboardGuide: React.FC<Props> = ({ onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-950 via-blue-900 to-sky-700 text-white shadow-xl">
        {/* Animated background glow */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 50% 90%, rgba(14,165,233,0.35), transparent 55%)',
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
        />

        {/* Top shimmer */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-200 opacity-90"
          initial={{ x: '-40%' }}
          animate={{ x: ['-40%', '40%', '-40%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <FiBookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold leading-tight">Quick Guide</h3>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 ring-1 ring-white/15">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                      Step-by-step
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/75">
                    Everything you need to run <span className="font-semibold text-white">Mentor Sessions</span>,
                    <span className="font-semibold text-white"> AI Interviews</span>, and the
                    <span className="font-semibold text-white"> Copilot Extension</span> smoothly.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                      Credits are billed per-minute (first ~3 minutes free)
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                      You can come back anytime
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs bg-white/95 hover:bg-white text-slate-900"
                onClick={() => onNavigate(AppState.CREATE_SESSION)}
              >
                <FiUsers className="h-4 w-4" /> Create Mentor Session
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs bg-white/95 hover:bg-white text-slate-900"
                onClick={() => onNavigate(AppState.SCHEDULE_INTERVIEW)}
              >
                <FiCpu className="h-4 w-4" /> Schedule AI Interview
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs bg-white/95 hover:bg-white text-slate-900"
                onClick={() => onNavigate(AppState.COPILOT_CONSOLE)}
              >
                <FiShield className="h-4 w-4" /> Stealth Console
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-2 text-xs bg-white/95 hover:bg-white text-slate-900"
                onClick={() => onNavigate(AppState.PROFILE)}
              >
                <FiHelpCircle className="h-4 w-4" /> Profile
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
            <Accordion type="multiple" defaultValue={['mentor']} className="w-full">
              <AccordionItem value="mentor" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <FiUsers className="h-4 w-4" />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Mentor Sessions</div>
                      <div className="text-xs text-white/70">Create → Copy Key → Join → Start/Stop → Complete + Summary</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/85">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">A) Create a session (mentor)</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>
                          From the dashboard top menu, click <span className="font-semibold text-white">Create Mentor Session</span>.
                        </li>
                        <li>
                          Fill the form (examples):
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                              <div className="text-xs text-white/70">Session Topic</div>
                              <div className="mt-1 font-mono text-xs">System Design — URL Shortener</div>
                            </div>
                            <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                              <div className="text-xs text-white/70">Student Name</div>
                              <div className="mt-1 font-mono text-xs">Aman</div>
                            </div>
                            <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                              <div className="text-xs text-white/70">Duration</div>
                              <div className="mt-1 font-mono text-xs">60 minutes</div>
                            </div>
                            <div className="rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                              <div className="text-xs text-white/70">Schedule</div>
                              <div className="mt-1 font-mono text-xs">Pick a future date/time</div>
                            </div>
                          </div>
                        </li>
                        <li>
                          Click <span className="font-semibold text-white">Create Session</span>. You’ll be sent back to the dashboard.
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">B) Copy + share the key</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>
                          On <span className="font-semibold text-white">Overview → Upcoming Mentor Sessions</span> you’ll see a key like:
                          <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 font-mono text-xs ring-1 ring-white/10">
                            <span className="text-white/80">Key:</span>
                            <span className="text-cyan-200">AB12CD</span>
                          </div>
                        </li>
                        <li>
                          Click <span className="font-semibold text-white">Copy Key</span> and send it to the other person (WhatsApp/Email/Chat).
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">C) Join a session (learner / attendee)</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>
                          In <span className="font-semibold text-white">Overview → Quick Join</span>, paste the key and press <span className="font-semibold text-white">Join</span>.
                        </li>
                        <li>
                          If you get “Not found / invalid key”, double-check the key (case sensitive) and that the session isn’t expired.
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">D) During the session (mentor + learner)</div>
                      <div className="mt-2 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <FiUsers className="h-4 w-4" /> Mentor controls
                          </div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                            <li>
                              Click <span className="font-semibold text-white">Start Meeting</span> to begin live transcription.
                            </li>
                            <li>
                              If needed, click <span className="font-semibold text-white">Stop Streaming</span> to pause, then Start/Resume again.
                            </li>
                            <li>
                              At the end, click <span className="font-semibold text-white">Complete Session</span> (this finalizes billing + status).
                            </li>
                            <li>
                              Use <span className="font-semibold text-white">AI Summary</span> and download PDF/CSV after completion.
                            </li>
                          </ul>
                        </div>
                        <div className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <FiZap className="h-4 w-4" /> Learner view
                          </div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                            <li>
                              Open the session to view the transcript live.
                            </li>
                            <li>
                              After completion, the summary appears under <span className="font-semibold text-white">Completed</span>.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-300/10 p-4 ring-1 ring-amber-200/30">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <FiHelpCircle className="h-4 w-4" /> If something breaks
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/85">
                        <li>“Microphone requires HTTPS” → use your Vercel domain (https) or localhost.</li>
                        <li>Transcript not updating → press Start/Resume again or refresh the tab.</li>
                        <li>“Insufficient credits” → Dashboard → Credits, top up, then retry.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <FiCpu className="h-4 w-4" />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">AI Interview (Web App)</div>
                      <div className="text-xs text-white/70">Schedule → Start → Generate answers → Stop/End → Summary</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/85">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">A) Create / schedule</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>
                          Click <span className="font-semibold text-white">Schedule AI Interview</span>.
                        </li>
                        <li>
                          Required fields:
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            <li><span className="font-semibold text-white">Title</span> (e.g. “Frontend Interview — React”) </li>
                            <li><span className="font-semibold text-white">Date/Time</span> (must be in the future)</li>
                            <li><span className="font-semibold text-white">Job Description</span> (paste or upload file)</li>
                            <li><span className="font-semibold text-white">Resume</span> (paste text)</li>
                          </ul>
                        </li>
                        <li>
                          <span className="font-semibold text-white">Use Default Resume</span> pulls your resume from <span className="font-semibold text-white">Profile</span>.
                        </li>
                        <li>
                          Optional but powerful:
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            <li>Response style preset (STAR, Bullet points, etc.)</li>
                            <li>Max lines (keeps answers short)</li>
                            <li>Example Q/A pairs to match your voice</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">B) Run the interview</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>From Dashboard → Upcoming interviews, click <span className="font-semibold text-white">Start</span>.</li>
                        <li>Allow microphone permissions when asked (or switch to <span className="font-semibold text-white">System Audio</span> if needed).</li>
                        <li>When the interviewer asks a question, press <span className="font-semibold text-white">Space</span> or click <span className="font-semibold text-white">Generate Answer</span>.</li>
                        <li>Use <span className="font-semibold text-white">Clear</span> to reset transcript between questions.</li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">C) Stop vs End</div>
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                        <li>
                          <span className="font-semibold text-white">Stop</span> (new): cancels a stuck answer stream without ending the session.
                        </li>
                        <li>
                          <span className="font-semibold text-white">End</span>: completes the interview, generates the summary, and returns to dashboard.
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">D) Credits + billing</div>
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                        <li><span className="font-semibold text-white">AI Interviews</span> use AI credits; <span className="font-semibold text-white">Mentor Sessions</span> use Mentor credits.</li>
                        <li>Billing is per-minute (rounded), with a small grace period.</li>
                        <li>Credits are deducted when you <span className="font-semibold text-white">complete/end</span> the session.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-amber-300/10 p-4 ring-1 ring-amber-200/30">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <FiHelpCircle className="h-4 w-4" /> Common fixes
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/85">
                        <li>“Stream failed / stuck” → click Stop, then Generate again.</li>
                        <li>“Not authenticated” → logout/login and retry.</li>
                        <li>Mic not capturing → switch mic device or choose System Audio and enable “Share audio”.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="copilot" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <FiShield className="h-4 w-4" />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Stealth Console + Chrome Extension (Copilot)</div>
                      <div className="text-xs text-white/70">Install → Login → Start → Share Tab Audio → Overlay shortcuts + camera</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/85">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">A) Start a Copilot session</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>Install the extension and login with the <span className="font-semibold text-white">same credentials</span> as the web app.</li>
                        <li>
                          You can create sessions either from:
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li><span className="font-semibold text-white">Extension popup</span> (Create / Start)</li>
                            <li><span className="font-semibold text-white">Web → Stealth Console</span> (Create session, then refresh extension)</li>
                          </ul>
                        </li>
                        <li>
                          Use the correct <span className="font-semibold text-white">Meeting URL</span> (example: Google Meet) so the overlay can attach.
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">B) Permissions (most important)</div>
                      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                        <li>
                          When Chrome asks what to share, pick the <span className="font-semibold text-white">meeting tab</span>.
                        </li>
                        <li>
                          Turn on <span className="font-semibold text-white">“Share tab audio”</span>. Without tab audio, transcript + hints won’t work.
                        </li>
                        <li>
                          If you use a phone/tablet for Stealth Console camera capture, HTTPS is required for live preview.
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">C) Overlay controls</div>
                      <div className="mt-2 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                          <div className="text-sm font-semibold">Buttons on the overlay rail</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            <li><span className="font-semibold text-white">H</span> = Hide panel (small bubble stays)</li>
                            <li><span className="font-semibold text-white">S</span> = Stealth (panel + bubble hidden)</li>
                            <li><span className="font-semibold text-white">C</span> = Complete session</li>
                            <li><span className="font-semibold text-white">Reconnect</span> = reconnect socket if disconnected</li>
                          </ul>
                        </div>
                        <div className="rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                          <div className="text-sm font-semibold">Keyboard shortcuts</div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            <li><span className="font-semibold text-white">Ctrl + Shift + B</span> = restore overlay</li>
                            <li><span className="font-semibold text-white">Ctrl + Insert</span> = capture screenshot (queue)</li>
                            <li><span className="font-semibold text-white">Ctrl + Shift + C</span> = CODE on queued screenshots</li>
                            <li><span className="font-semibold text-white">Ctrl + .</span> = single-shot CODE</li>
                            <li><span className="font-semibold text-white">Ctrl + Shift + H</span> = Help Me</li>
                            <li><span className="font-semibold text-white">Ctrl + ,</span> = Explain</li>
                            <li><span className="font-semibold text-white">Ctrl + Shift + U</span> = clear screenshots</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">D) Stealth Console on phone/tablet</div>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                        <li>Login to the web app on a second device.</li>
                        <li>Open <span className="font-semibold text-white">Stealth Console</span> and select the active session.</li>
                        <li>Use the <span className="font-semibold text-white">Camera</span> button to capture a photo/screenshot and send it into the session.</li>
                      </ol>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="statuses" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <FiType className="h-4 w-4" />
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">Sessions, summaries, profile</div>
                      <div className="text-xs text-white/70">Completed/Expired, delete, default resume, JD upload</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/85">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">A) Status meanings</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        <li><span className="font-semibold text-white">Scheduled</span>: upcoming, not started yet.</li>
                        <li><span className="font-semibold text-white">In progress</span>: started (live).</li>
                        <li><span className="font-semibold text-white">Completed</span>: ended properly; summary/transcript available.</li>
                        <li><span className="font-semibold text-white">Expired</span>: time window passed or duration used.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">B) Where summaries live</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        <li>Dashboard → <span className="font-semibold text-white">Completed</span>: generate/view AI Summary.</li>
                        <li>Mentor session page also has <span className="font-semibold text-white">AI Summary</span> + PDF/CSV.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">C) Delete sessions</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        <li>Completed/Expired lists allow deletion (can’t be undone).</li>
                        <li>Download PDF/CSV first if you need the transcript later.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="text-xs font-semibold uppercase tracking-wide text-white/70">D) Profile + default resume</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        <li>Save your resume in <span className="font-semibold text-white">Profile</span> to set the <span className="font-semibold text-white">Default Resume</span>.</li>
                        <li>On Schedule AI Interview, click <span className="font-semibold text-white">Use Default Resume</span> to autofill.</li>
                        <li>Upload a Job Description file to auto-extract text before scheduling.</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-amber-300/10 p-4 ring-1 ring-amber-200/30">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <FiHelpCircle className="h-4 w-4" /> Quick troubleshooting checklist
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/85">
                        <li>Hard refresh 404 → fixed by SPA routing (if you still see it, redeploy frontend).</li>
                        <li>Network lag → check credits + your internet; refresh dashboard to reload sessions.</li>
                        <li>Any “Not found” → confirm you’re using the right key/session and you’re logged in.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-4 text-xs text-white/60">
            Tip: Keep this guide open on a second screen while you run your first session.
          </div>
        </div>
      </div>
    </motion.div>
  );
};
