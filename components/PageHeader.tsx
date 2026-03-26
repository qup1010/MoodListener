import React from 'react';

interface PageHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  children,
  className = ''
}) => {
  const headerClassName = ['page-header', className].filter(Boolean).join(' ');

  return (
    <header className={headerClassName}>
      <div className="page-header__row">
        <div className={`page-header__title-group ${leading ? 'page-header__title-group--with-leading' : ''}`}>
          {leading && <div className="page-header__leading">{leading}</div>}
          <div className="min-w-0 flex-1">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        </div>

        {trailing && <div className="page-header__trailing">{trailing}</div>}
      </div>

      {children && <div className="page-header__tools">{children}</div>}
    </header>
  );
};
