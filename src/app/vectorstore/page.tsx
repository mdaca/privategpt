import { Vectorstore, VectorstoreProp } from "@/features/vectorstore/vectorstore";

export const dynamic = 'force-dynamic';

export default async function Home(props: VectorstoreProp) {
  return <Vectorstore {...props} />;
}
