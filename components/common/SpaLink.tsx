import React from 'react';

export function spaNavigate(href: string) {
  const url = href.startsWith('/') ? href : `/${href}`;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export default function SpaLink({ href, onClick, children, ...props }: Props) {
  return (
    <a
      href={href}
      onClick={(e) => {
        // allow ctrl/cmd click and external links
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (props.target && props.target !== '_self')) {
          onClick?.(e);
          return;
        }
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
          onClick?.(e);
          return;
        }
        e.preventDefault();
        onClick?.(e);
        spaNavigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
