'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { SectionKicker, SectionTitle, PageIntro } from '@/components/ui/Panel';
import { PageMotion } from '@/components/motion/PageMotion';
import { media } from '@/lib/ui/theme';

const Main = styled.main<{ $wide?: boolean }>`
  width: var(--page-width);
  margin: 0 auto;
  padding: clamp(32px, 5vw, 68px) var(--page-pad) 0;
`;

const Head = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: clamp(28px, 4vw, 48px);
  flex-wrap: wrap;

  ${media.mobile} {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 26px;
  }
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
        <PageMotion>
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
            </>
          )}
          <div>{children}</div>
        </PageMotion>
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
