import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Head from 'next/head';

// Dynamically import the actual vote page with SSR disabled
const VotePageClientOnly = dynamic(
  () => import('./vote'),
  { ssr: false }
);

const DynamicVotePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Vote on Freestyles | Freestyle Fiend</title>
        <meta name="description" content="Vote on freestyles from the community" />
      </Head>
      <VotePageClientOnly />
    </>
  );
};

export default DynamicVotePage;
