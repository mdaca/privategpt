import * as React from "react"

import { cn } from "@/lib/utils"
import { Textarea } from "./textarea"
import { useEffect, useRef } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textareaprompt = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {

  
    const prompt: any = useRef();

    
  const updatePrompt = (e: any) => {
    // We don't want the page to refresh
    e.preventDefault()

    const formURL = '/api/vectorstoreprompt'
    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify({ name: props.defaultValue, prompt: prompt.current.value }),
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

    const [promptValue, setPromptValue] = React.useState(props.value);
    useEffect(() => {
      fetch('/api/vectorstore', { 
        method: "POST",cache: 'no-store' })
        .then((res) => res.json())
        .then((datastores) => {
          const collPrompt = datastores.find((item) => { return item.collectionName == props.defaultValue; }).collectionPrompt;
          setPromptValue(collPrompt);
        });
    }, []);

    return (<div>
      <Textarea
      rows={8} ref={prompt}
      value={promptValue}
      defaultValue="Use the following pieces of context to answer the users question.  You work at the same company as the user.  It is called Spin Systems Inc. (SpinSys).  You are working together to generate proposals.  When generating a response, you should write in a profressional tone that will win proposals. "
      onChange={(event:any) => { setPromptValue(event.target.value); }  }
      />
      <button onClick={updatePrompt} style={{marginTop: '18px'}} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 p-4" >Update Instructions</button>
      </div>       
    )
  }
)
Textareaprompt.displayName = "Textareaprompt"

export { Textareaprompt }
