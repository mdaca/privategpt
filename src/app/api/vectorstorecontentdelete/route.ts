import { userHashedId } from '@/features/auth/helpers';
import { db } from '@/features/common/mysql';
import { GetMyStores } from '@/features/vectorstore/vectorstore-service';
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';
import { ChromaClient } from 'chromadb';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json();

  const token: any = await getToken({ req: request });

  let access = false;

  if(token.isAdmin == true) {
    access = true;
  }

  let graphStore = false;

  if(access == false) {
    let result = await db.query(`SELECT userId, graphStore FROM stores where collectionName = ? and isDeleted = 0 and isPrivate = 1
                                 UNION
                                 SELECT 'PUBLIC', graphStore FROM stores where collectionName = ? and isDeleted = 0 and isPrivate = 0`, [body.name]);
    if(result[0][0].userId == 'PUBLIC' || result[0][0].userId == await userHashedId()) {
      access = true;
      graphStore = result[0][0].graphStore;
    }
  } else {
    let result = await db.query(`SELECT graphStore FROM stores where collectionName = ? and isDeleted = 0`, [body.name]);
    graphStore = result[0][0].graphStore;
  }

  if(access == false) {
    return NextResponse.json({ success: false })
  }

  if(graphStore) {


    async function get_neo4jgraph(cn: string) {
      const url = process.env.NEO4J_URI!;
      const username = process.env.NEO4J_USERNAME!;
      const password = process.env.NEO4J_PASSWORD!;
      const graph = await Neo4jGraph.initialize({ url: url, username: username, password: password, database: cn});
      return graph;
    }
    let graph = await get_neo4jgraph(body.name);
    
    await graph.query(
      `MATCH (p:Parent)-[*0..]->(x)  where ID(p)=$id
       DETACH DELETE p
      `, {
        "id": parseInt(body.id)
      }
    );
  } else {

    
    const client = new ChromaClient({
      path: "http://localhost:8000"
    });
  
    const collection = await client.getCollection({
      name: body.name
    });
  
    await collection.delete({
      ids: [body.id]
      });


  }

  return NextResponse.json({ success: true })
}