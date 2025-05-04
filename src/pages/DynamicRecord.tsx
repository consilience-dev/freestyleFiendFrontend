import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import Head from 'next/head';

// Dynamically import the actual record page with SSR disabled
const RecordPageClientOnly = dynamic(
  () => import('./record'), 
  { ssr: false }
);

const DynamicRecordPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Record Your Freestyle | Freestyle Fiend</title>
        <meta name="description" content="Record your freestyle rap over beats" />
      </Head>
      <RecordPageClientOnly />
    </>
  );
};

export default DynamicRecordPage;
