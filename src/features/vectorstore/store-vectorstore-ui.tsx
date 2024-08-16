'use client';

import ChatRow from "@/components/chat/chat-row";
import { Card } from "@/components/ui/card";
import { FC, use, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "@progress/kendo-react-upload";
import React from "react";
import {
  Grid,
  GridColumn as Column,
  GridToolbar, GridDetailRow
} from "@progress/kendo-react-grid";
import { Input, NumericTextBox, TextArea } from "@progress/kendo-react-inputs";
import { Textarea } from "@/components/ui/textarea";
import { Textareaprompt } from "@/components/ui/textareaprompt";
import type { HitTargets, Node, Relationship } from '@neo4j-nvl/base';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import type { MouseEventCallbacks } from '@neo4j-nvl/react';
export type VectorProp = {
  searchParams: {
    pageSize?: number;
    pageNumber?: number;
  };
};
//export const revalidate = 10;

export const VectorestoreUI: FC<VectorProp> = async (props: any) => {

  if(typeof props == 'undefined' || typeof props["params"] == 'undefined') {
    return;
  }

  let graph = false;
  
  if(typeof props["searchParams"] != 'undefined') {
    graph = props["searchParams"].graph == 'true';
  }

  let collectionName = props["params"].storeid;
  
  const collection: any = [];
  
  // = await GetCollection(collectionName,
  //   pageSize,
  //   pageNumber);
  // const hasMoreResults = collection && collection.length === pageSize;

  const EditCommandCell = (props) => {
    return (
      <td>
        <button
        className="k-button ml-2 k-button-md k-rounded-md k-button-solid k-button-solid-base k-grid-remove-command"
        onClick={() => {
         if(confirm("Are you sure?")) {
          
            const formURL = '/api/vectorstorecontentdelete'
            let name = '';

            // POST the data to the URL of the form
            fetch(formURL, {
              method: "POST",
              body: JSON.stringify({ name: collectionName, id: props.dataItem.id }),
              headers: {
                'accept': 'application/json',
              },
            }).then((response) => response.json())
            .then((data) => {
            
              if(data.success == true) {
                refreshData(page.skip, page.take);
              } else {
                alert('Failure');
              }
            });
          }
        }
      }
       >
        Remove
      </button>
      </td>
    );
  };
  
  const [isLoading, setLoading] = useState(true);

  function popNodes(data) {
    let relats: any[] = [];
    let colors = {};

    const randomColor = (() => {
      const r = Math.floor(130 + (Math.random() * 126));
      const g = Math.floor(130 + (Math.random() * 126));
      const b = Math.floor(130 + (Math.random() * 126));
      return `rgb(${r}, ${g}, ${b})`;
    });

    for(var i = 0; i < data.length; i++) {
      data[i].html = genDiv(data[i].document);
      data[i].size = 80;

      let type = data[i].document.split(' ')[0];

      if(typeof colors[type] == 'undefined') {
        colors[type] = randomColor();
      }

      data[i].color = colors[type];

      let clats: any[] = [];
      for(var j = 0; j < data[i].metadata.relationships.length; j++) {
        let to = data[i].metadata.relationships[j].to;
        let found = false;
        for(var k = 0; k < data.length; k++) {
          if(data[k].id == to) {
            found = true;
            break;
          }
        }
        if(found == true) {
          clats.push(data[i].metadata.relationships[j]);
        }
      }
      relats = relats.concat(clats);
    }

    setNodes(data);
    setRelationships(relats);
  }

  const refreshData = async (skip:number, take:number) => {
    fetch('/api/vectorstorecontent?ts=' + (new Date().getTime()).toString(), { cache: 'no-store',  method: "POST",
    body: JSON.stringify({ name: collectionName, take: take, skip: skip, filter: filterText.current.value }),
    headers: {
      'accept': 'application/json',
    } })
      .then((res) => res.json())
      .then((data) => {
        setData(data);

        if(graph) {
          popNodes(data);
        }
      });
  }
  useEffect(() => {
    fetch('/api/vectorstorecontent?ts=' + (new Date().getTime()).toString(), { cache: 'no-store',  method: "POST",
    body: JSON.stringify({ name: collectionName, take: page.take, skip: page.skip, filter: filterText.current.value }),
    headers: {
      'accept': 'application/json',
    } })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        
        if(graph) {
          popNodes(data);
        }

      })
  }, []);

//  refreshData();

  const [data, setData] = React.useState<any[]>([]);
  
  const addNew = async () => {
    window.location.href = `/vectorstore/${collectionName}/upload?graph=${graph}`;
  };

  const MyEditCommandCell = (props) => (
    <EditCommandCell {...props} />
  );
  
  const expandChange = (event) => {
    event.dataItem.expanded = event.value;
    setData([...data]);
  };

  const DetailComponent = (props) => {
    const data = props.dataItem;
    if (data) {
      return (
        <div>{data.document}</div>
      );
    }
  };
  const initialDataState = {
    skip: 0,
    take: 10,
    filter: ''
  };

  const pageChange = (event) => {
    const targetEvent = event.targetEvent;
    const take = event.page.take;


    setPage({
      skip: event.page.skip,
      take: event.page.take,
      filter: ''
    });
    refreshData(event.page.skip, event.page.take);
  };

  const filterText: any = useRef();
  
  const [page, setPage] = React.useState(initialDataState);

  const _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      refreshData(page.skip, page.take);
    }
  };

  function genDiv(value, noStyles=false) {
    var div = document.createElement('div');
    div.innerHTML = value;
    if(!noStyles) {
      div.style['margin-top'] = '20%';
      div.style['margin-left'] = '20%';
    }
    return div;
  }
  function genSpan(value, noStyles=false) {
    var div = document.createElement('span');
    div.innerHTML = value;
    if(!noStyles) {
      div.style['margin-top'] = '20%';
      div.style['margin-left'] = '20%';
    }
    return div;
  }

  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const mouseEventCallbacks: MouseEventCallbacks = {
    onHover: (element: Node | Relationship, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onHover', element, hitTargets, evt),
    onRelationshipRightClick: (rel: Relationship, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onRelationshipRightClick', rel, hitTargets, evt),
    onNodeClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onNodeClick', node, hitTargets, evt),
    onNodeRightClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onNodeRightClick', node, hitTargets, evt),
    onNodeDoubleClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onNodeDoubleClick', node, hitTargets, evt),
    onRelationshipClick: (rel: Relationship, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onRelationshipClick', rel, hitTargets, evt),
    onRelationshipDoubleClick: (rel: Relationship, hitTargets: HitTargets, evt: MouseEvent) =>
      console.log('onRelationshipDoubleClick', rel, hitTargets, evt),
    onCanvasClick: (evt: MouseEvent) => console.log('onCanvasClick', evt),
    onCanvasDoubleClick: (evt: MouseEvent) => console.log('onCanvasDoubleClick', evt),
    onCanvasRightClick: (evt: MouseEvent) => console.log('onCanvasRightClick', evt),
    onDrag: (nodes: Node[]) => console.log('onDrag', nodes),
    onPan: (panning: any, evt: MouseEvent) => console.log('onPan', panning),
    onZoom: (zoomLevel: number) => console.log('onZoom', zoomLevel)
  }

  return (
    <Card className="h-full flex pt-8 overflow-y-auto">
      
      <div className="container mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Store
          <span className="coll-name"> - {collectionName}</span></h2>
          <p className="text-muted-foreground">The content for this store</p>
        <div className="items-center space-x-2 p-2">
        <Link style={{float: 'right'}}
                    href={{
                      pathname: `/vectorstore`
                    }}
                  >
                    &lt; Back to Knowledge Stores
                  </Link>
                  </div>
        </div>
        <InteractiveNvlWrapper style={{display: graph ? '' : 'none' }} nodes={nodes} rels={relationships} mouseEventCallbacks={mouseEventCallbacks} />
      <Grid
        style={{
          height: "800px",
        }}
        data={data}
        detail={DetailComponent}
        expandField="expanded"
        onExpandChange={expandChange}
        skip={page.skip}
        total={data.length == 0 ? 0 : data[0].total}
        take={page.take}
        pageable={{
          buttonCount: 4,
          pageSizes: [10, 20, 50],
          pageSizeValue: 10,
        }}
        onPageChange={pageChange}
      >
        <GridToolbar>
          <button
            title="Add new"
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
            onClick={addNew}
          >
            Add Content
          </button>
          <Input onKeyDown={_handleKeyDown} 
                    ref={filterText} width="200px" className="search-content-box" placeholder="Search content..." ></Input>
        </GridToolbar>
        <Column field="sourceName" title="Source Name" width="250px"   />
        <Column field="metadata" title="Content Metadata" />
        <Column cell={MyEditCommandCell}  width="250px"/>
      </Grid>
      <fieldset className="pb-10">
                  <h3 className="text-xl font-bold tracking-tight">Store Instructions</h3>
                  
        <Textareaprompt defaultValue={collectionName} />
              
                </fieldset>
        </div>
        
          </Card>
  );
};

