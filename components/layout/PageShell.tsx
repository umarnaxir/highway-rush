'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { SectionKicker, SectionTitle, PageIntro } from '@/components/ui/Panel';
import { media } from '@/lib/ui/theme';

const Main = styled.main<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? '1520px' : '1300px')};
  margin: 0 auto;
  padding: clamp(32px, 5vw, 68px) clamp(16px, 3vw, 36px) 0;
  animation: pageIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const Head = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: clamp(28px, 4vw, 48px);
  flex-wrap: wrap;
`;

const HeadCopy = styled.div`
  min-width: 0;
`;

const HeadActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Rule = styled.div`
  height: 1px;
  width: 100%;
  margin-top: 20px;
  background: linear-gradient(90deg, var(--line-strong), transparent);
`;

export interface PageShellProps {
  children: ReactNode;
  kicker?: string;
  title?: ReactNode;
  intro?: string;
  actions?: ReactNode;
  wide?: boolean;
  bare?: boolean;
}

export function PageShell({ children, kicker, title, intro, actions, wide, bare }: PageShellProps) {
  return (
    <>
      <NavBar />
      <Main $wide={wide}>
        {!bare && (kicker || title) && (
          <>
            <Head>
              <HeadCopy>
                {kicker && <SectionKicker>{kicker}</SectionKicker>}
                {title && <SectionTitle>{title}</SectionTitle>}
                {intro && <PageIntro style={{ marginTop: 14 }}>{intro}</PageIntro>}
              </HeadCopy>
              {actions && <HeadActions>{actions}</HeadActions>}
            </Head>
            <Rule />
          </>
        )}
        <div style={{ marginTop: bare ? 0 : 28 }}>{children}</div>
      </Main>
      <Footer />
    </>
  );
}

export const TwoCol = styled.div<{ $ratio?: string }>`
  display: grid;
  grid-template-columns: ${({ $ratio }) => $ratio ?? 'minmax(0, 1.45fr) minmax(0, 1fr)'};
  gap: 18px;

  ${media.desktop} {
    grid-template-columns: 1fr;
  }
`;

export const ThreeCol = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  ${media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.mobile} {
    grid-template-columns: 1fr;
  }
`;
