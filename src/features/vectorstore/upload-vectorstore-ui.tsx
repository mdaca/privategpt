'use client';

import ChatRow from "@/components/chat/chat-row";
import { Card } from "@/components/ui/card";
import { FC, use, useRef, useState } from "react";
import Link from "next/link";
import { Upload } from "@progress/kendo-react-upload";
import React from "react";
import { InputClearValue, InputSeparator, TextArea, TextBox } from "@progress/kendo-react-inputs";

export type VectorProp = {
  storeId: string;
};


function getParameterByName(name, url = window.location.href): string {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return '';
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export const VectorstoreUpload: FC<VectorProp> = async (props: any) => {

  if(typeof props == 'undefined') {
    return;
  }

  let graph = false;
  
  graph = getParameterByName('graph') == 'true';

  let collectionName = props.storeId;
  const saveUrl = '/api/upload?cn=' + collectionName;
  const removeUrl = '/api/upload/remove';

  const onBeforeUpload = (e: any) => {
    e.additionalData['nodes'] = tbNodes.current.value;
    e.additionalData['relats'] = tbRelats.current.value;
  };

  const submitFormTA = (e: any) => {
    // We don't want the page to refresh
    e.preventDefault()

    const formURL = '/api/content'
    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify({ name: collectionName, content: valueTA.current.value, title: titleTA.current.value, nodes: tbNodes.current.value, relats: tbRelats.current.value }),
      headers: {
        'accept': 'application/json',
      },
    }).then((response) => response.json())
    .then((data) => {
     
      if(data.success == true) {
        alert('Success');
      } else {
        alert('Failure');
      }
    })
  }
  
  const submitForm = (e: any) => {
    // We don't want the page to refresh
    e.preventDefault()

    const formURL = '/api/scrape'
    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify({ name: collectionName, url: value.current.value, nodes: tbNodes.current.value, relats: tbRelats.current.value }),
      headers: {
        'accept': 'application/json',
      },
    }).then((response) => response.json())
    .then((data) => {
     
      if(data.success == true) {
        alert('Success');
      } else {
        alert('Failure');
      }
    })
  }
  

  const value: any = useRef();
  const valueTA: any = useRef();
  const titleTA: any = useRef();
  const tbNodes: any = useRef();
  const tbRelats: any = useRef();

  return (
    <Card className="h-full flex pt-8 overflow-y-auto">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Store
          <span className="coll-name"> - {collectionName}</span></h2>
          <p className="text-muted-foreground">Add content to the store</p>
        </div>
        <div className="items-center space-x-2 p-2">
        <Link style={{float: 'right'}}
                    href={{
                      pathname: `/vectorstore/${collectionName}`,
                      query: `graph=${graph}`
                    }}
                  >
                    &lt; Back to Knowledge Store
                  </Link>
                  </div>
        <div className="items-left space-x-2">
          <Card className="flex-1 mt-8 ml-2"> 
          {graph ? (
          <fieldset>
                  <div>Allowed Graph Node Types (comma separated)</div>
          <TextBox
                    name="name"
                    ref={tbNodes}
                    placeholder="PERSON,ORGANIZATION,SKILL"
                  />
                  <div>Allowed Graph Relationship Types (comma separated)</div>
          <TextBox
                    name="name"
                    ref={tbRelats}
                    placeholder="HAS,STUDIED_AT,WORKED_AT"
                  />
                  <div className="flex-1 mt-2" ></div>
                  </fieldset>
                  
                ): (<div></div>) }
          <fieldset >
                  <h3  className="text-xl font-bold tracking-tight">Upload PDFs</h3>
        <Upload
          batch={false}
          multiple={true}
          defaultFiles={[]}
          withCredentials={false}
          saveUrl={saveUrl}
          onBeforeUpload={onBeforeUpload}
          removeUrl={removeUrl}
        />
        </fieldset>
          </Card>
          <Card className="flex-1 mt-8">
          <div className="k-form"> 
          <fieldset>
                  <h3 className="text-xl font-bold tracking-tight">Crawl Website</h3>
                  <TextBox
                    name="name"
                    placeholder="https://..."
                    ref={value}
                  />
                </fieldset>
                <button onClick={submitForm} style={{marginTop: '18px'}} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 p-4" >Crawl Page and Linked Sub-pages</button>
              </div>
          </Card>
          <Card className="flex-1 mt-8">
          <div className="k-form" > 
          <fieldset>
                  <h3 className="text-xl font-bold tracking-tight">Paste Content</h3>
                  <TextArea
                    name="name"
                    ref={valueTA}
                    placeholder="Paste content here"
                  />
                </fieldset>
          <fieldset>
                  <div>Content Title</div>
          <TextBox
                    name="name"
                    ref={titleTA}
                    placeholder="My Sample Content"
                  />
                  </fieldset>
                <button onClick={submitFormTA} style={{marginTop: '18px'}} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 p-4" >Submit Content</button>
              </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
