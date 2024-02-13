'use client';

import { Card } from "@/components/ui/card";
import { useRef, useState} from "react";
import {
  InputClearValue,
  InputSeparator,
  TextBox,
} from "@progress/kendo-react-inputs";
import React from "react";
import { Icon } from "@progress/kendo-react-common";
import { redirect } from "next/navigation";

export type VectorstoreProp = {
};
export const Vectorstoreadd = async (props: VectorstoreProp) => {
  

const state: any = useRef();

  const FormComponent = () => (
    <form className="k-form" onSubmit={submitForm}>
                <fieldset>
                  <div>Collection Name</div>
                  <TextBox
                    name="name"
                    ref={state}
                    placeholder="My Collection"
                  />
                </fieldset>
                <button style={{marginTop: '18px'}} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 p-4" type="submit">Add Collection</button>
              </form>
  );

  const submitForm = (e: any) => {
    // We don't want the page to refresh
    e.preventDefault();

    const formURL = '/api/vectorstoreadd'
    let name = '';

    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify({ name: state.current.value }),
      headers: {
        'accept': 'application/json',
      },
    }).then((response) => response.json())
    .then((data) => {
     
      if(data.success == true) {
        alert('Success');
        window.location.href = '/vectorstore';
      } else {
        alert('Expected collection name that (1) contains 3-63 characters, (2) starts and ends with an alphanumeric character, (3) otherwise contains only alphanumeric characters, underscores or hyphens (-), (4) contains no two consecutive periods (..) and (5) is not a valid IPv4 address');
      }
    });
  };

  return (<Card className="h-full flex pt-8 overflow-y-auto">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add a Collection</h2>
          <p className="text-muted-foreground">Collections contain content to provide context</p>
        </div>
        <div className="flex items-center space-x-2">
          <Card className="flex-1">
          <FormComponent />
          </Card>
        </div>
      </div>
    </Card>);
};
