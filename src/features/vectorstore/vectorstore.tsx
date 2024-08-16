'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { KnowledgeStoreModel } from "./vectorstore-service";
import { redirect } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import React from "react";
import {
  Grid,
  GridColumn as Column,
  GridToolbar,
} from "@progress/kendo-react-grid";
import { MyCommandCell } from "./vectorstore-commandcell";
import { userHashedId } from "../auth/helpers";
import { DropDownCell } from "./vectorstore-dropdown";
import EditForm from "./vectorstore-editform";
import { get } from "https";
import { useSession } from "next-auth/react";

export type VectorstoreProp = {
  searchParams: {
    pageSize?: number;
    pageNumber?: number;
  };
};
export const revalidate = 10;

export const Vectorstore = async (props: VectorstoreProp) => {
  let _pageNumber = Number(props.searchParams ? (props.searchParams.pageNumber ?? 0) : 0);
  let pageSize = Number(props.searchParams ? (props.searchParams.pageSize ?? 5): 5);
  let pageNumber = _pageNumber < 0 ? 0 : _pageNumber;
  let nextPage = Number(pageNumber) + 1;
  let previousPage = Number(pageNumber) - 1;

  const EditCommandCell = (props) => {
    
    const { data: session } = useSession();
    const user: any = session?.user;

    if((user && user.isAdmin) || props.dataItem.isPrivate == 1) {
      return (
        <td>
          {/* <button
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
            onClick={() => props.enterEdit(props.dataItem)}
          >
            Edit
          </button> */}
          <button
          className="k-button ml-2 k-button-md k-rounded-md k-button-solid k-button-solid-base k-grid-remove-command"
          onClick={() =>
            confirm("Confirm deleting: " + props.dataItem.collectionName) &&
            //props.remove(props.dataItem)
            deleteCollection(props.dataItem.collectionName)
          }
         >
          Remove
        </button>
        </td>
      );

    } else {
      return (<div></div>);
    }
  };

  const [isLoading, setLoading] = useState(true);

  const refreshData = async () => {
    fetch('/api/vectorstore', { 
      method: "POST",cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      });
  }
  useEffect(() => {
    fetch('/api/vectorstore', { 
      method: "POST",cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, []);

//  refreshData();
  const hasMoreResults = false;


  function deleteCollection(id: any): void {
    //et id = event.currentTarget.id;
    
    const formURL = '/api/vectorstoredelete'
    let name = '';

    // POST the data to the URL of the form
    fetch(formURL, {
      method: "POST",
      body: JSON.stringify({ name: id }),
      headers: {
        'accept': 'application/json',
      },
    }).then((response) => response.json())
    .then((data) => {
     
      if(data.success == true) {
        refreshData();
      } else {
        alert('Failure');
      }
    });
  }
  const [openForm, setOpenForm] = React.useState(false);
  const [editItem, setEditItem] = React.useState({
    id: '',
    isPrivate: 1,
    storeType: 'Large',
    createdAt: new Date().toISOString(),
    userId: '',
    useName: '',
    isDeleted: false,
    collectionName: '',
    collectionDesc: ''
  });
  const [data, setData] = React.useState<KnowledgeStoreModel[]>([]);
  const enterEdit = (item) => {
    setOpenForm(true);
    setEditItem(item);
  };
  const handleSubmit = (event) => {
    let newItem = true;
    let newData = data.map((item) => {
      if (event.id === item.id) {
        newItem = false;
        item = {
          ...event,
        };
      }
      return item;
    });
    if (newItem) {
      const formURL = '/api/vectorstoreadd'
      // POST the data to the URL of the form
      fetch(formURL, {
        method: "POST",
        body: JSON.stringify({ name: event.collectionName, desc: event.collectionDesc, private: event.isPrivate.value ? event.isPrivate.value : event.isPrivate, storeType: event.storeType.value ? event.storeType.value : event.storeType }),
        headers: {
          'accept': 'application/json',
        },
      }).then((response) => response.json())
      .then((data) => {
      
        if(data.success == true) {
          refreshData();
        } else {
          alert('Expected collection name that (1) contains 3-63 characters, (2) starts and ends with an alphanumeric character, (3) otherwise contains only alphanumeric characters, underscores or hyphens (-), (4) contains no two consecutive periods (..) and (5) is not a valid IPv4 address');
        }
      });
    }
    setOpenForm(false);
  };

  let newID = 0;

  const addNew = async () => {
    setOpenForm(true);

    newID--;

    setEditItem({
      id: newID.toString(),
      isPrivate: 1,
      storeType: 'Large',
      createdAt: new Date().toISOString(),
      userId: '',
      useName: '',
      isDeleted: false,
      collectionName: '',
      collectionDesc: ''
    }); // you need to change the logic for adding unique ID value;
  };

  const handleCancelEdit = () => {
    setOpenForm(false);
  };
  const MyEditCommandCell = (props) => (
    <EditCommandCell {...props} enterEdit={enterEdit} />
  );

  return (
    <div>
    <Card className="h-full flex pt-8 overflow-y-auto">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Stores</h2>
          <p className="text-muted-foreground">Collections of content to provide context</p>
        </div>
        
    
        <Grid
        style={{
          height: "600px",
        }}
        data={data}
      >
        <GridToolbar>
          <button
            title="Add new"
            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary"
            onClick={addNew}
          >
            Add new
          </button>
        </GridToolbar>
        <Column field="collectionName" title="Store Name" width="250px" cell={props => (
  <td>
    <a className="vector-store-link" href={`/vectorstore/${props.dataItem.collectionName}/?graph=${props.dataItem.storeType == 'Graph'}`} >{props.dataItem.collectionName}</a>
  </td>)}  />
        <Column field="collectionDesc" title="Store Description" />
        <Column field="isPrivate" title="Private ?" width="200px" cell={props => (
  <td>
    <span>{`${props.dataItem.isPrivate == 1 || props.dataItem.isPrivate == true ? 'Yes' : 'No'}`}</span>
  </td>)} />
  <Column field="storeType" title="Store Type" width="200px" cell={props => (
  <td>
    <span>{`${props.dataItem.storeType ? props.dataItem.storeType : 'Large'}`}</span>
  </td>)} />
        <Column cell={MyEditCommandCell} />
      </Grid>
      {openForm && (
        <EditForm
          cancelEdit={handleCancelEdit}
          onSubmit={handleSubmit}
          item={editItem}
        />
      )}
      </div>
    </Card></div>
  );
};
