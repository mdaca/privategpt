"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatThreadModel, CreateChatThread } from "../chat-thread-service";
import { FC, FormEvent, useRef, useState } from "react";
import { Window, WindowActionsBar } from "@progress/kendo-react-dialogs";
import { ComboBox, ComboBoxChangeEvent, DropDownList, DropDownListChangeEvent } from "@progress/kendo-react-dropdowns";
import { KnowledgeStoreModel } from "@/features/vectorstore/vectorstore-service";

interface Prop {
  cats: any;
  colls: KnowledgeStoreModel[];
}
export const NewChat: FC<Prop> = (props) => {
  const router = useRouter();
  

const [cats, setCats] = useState<string[]>(['Default']);
const cat: any = useRef();
const newCat: any = useRef();
const store: any = useRef();

const [newCategory, setNewCategory] = useState(false);

const colls = props.colls?.map((item: any) => { return item.collectionName; });


  const startNewChat = async () => {
    try {

      if(cats.length == 1) {
          let newCats: string[] = ['Default', '(new)'];

          for(var prop in props.cats) {
            if(newCats.indexOf(prop) == -1) {
              newCats.push(prop);
            }
          }

          setCats(newCats);
      }
      setNewCategory(false);
      setnewChatVisible(true);

      //const newChatThread = await CreateChatThread();
      //if (newChatThread) {
       // router.push("/chat/" + newChatThread.id);
       // router.refresh();
      //}
    } catch (e) {
      console.log(e);
    }
  };

  const [newChatVisible, setnewChatVisible] = useState(false);
  const toggleDialog = () => {
    setnewChatVisible(!newChatVisible);
  };

  async function handleSubmit(event): Promise<void> {
    
    let category = cat.current ? cat.current.value : null;
    
    if(category == '(new)') {
      category = newCat.current.value;
    }

    setnewChatVisible(false);

    const newChatThread = await CreateChatThread(category, store.current.value);
    if (newChatThread) {
       props.cats[category].push(newChatThread);
       router.push("/chat/" + newChatThread.id);
       router.refresh();
    }

  }

  function onComboChange(event: ComboBoxChangeEvent): void {
    
  }

  function onDropDownChange(event: DropDownListChangeEvent): void {
    setNewCategory(event.target.value == '(new)');
  }

  return (
    <div>
    <Button  style={{float: 'left', marginLeft: '24px'}}
      className="gap-2"
      variant={"outline"}
      size={"sm"}
      onClick={() => startNewChat()}
    >
      <PlusCircle size={16} /> Chat
    </Button>
    {newChatVisible && (
      <div>
        <div className="modal" ></div>
        <Window title={"New Chat"} onClose={toggleDialog} initialHeight={350}>
          <form className="k-form" onSubmit={handleSubmit}>
            <fieldset>
              <legend></legend>

              <label className="k-form-field">
                <span>Category</span>
                <DropDownList data={cats} ref={cat}
                onChange={onDropDownChange}
                defaultValue={"Default"} />
                {newCategory && (<div className="m-2"><input className="k-input" placeholder="New Category..." ref={newCat} ></input></div>)}
              </label>
              <label className="k-form-field">
                <span>Knowledge Store</span>    
                <ComboBox 
                data={colls}
                id="collections"
                allowCustom={false}
                placeholder="Select a Store"
                onChange={onComboChange}
                defaultValue={""}
                ref={store}
              />
              </label>
            </fieldset>

            <WindowActionsBar layout={"stretched"}>
            <button
              type="button"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
              onClick={toggleDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
              onClick={handleSubmit}
            >
              Create Chat
            </button>
          </WindowActionsBar>
          </form>
        </Window>
      </div>
      )}
    </div>
  );
};
