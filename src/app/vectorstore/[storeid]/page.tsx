import { VectorProp, VectorestoreUI } from "@/features/vectorstore/store-vectorstore-ui";

export const dynamic = 'force-dynamic';

export default async function Home(props: VectorProp) {
  return <VectorestoreUI {...props} />;
}
