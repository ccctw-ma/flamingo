import { Checkbox, Popconfirm } from "antd";
import React, { useEffect, useState } from "react";
import { LEFT_TAB_ITEM_HEIGHT } from "../utils/constants";
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Input from "antd/es/input/Input";
import { useGroup } from "../utils/store";
export default function GroupItem(props: any) {
  const { group: current } = props;
  const [isEdit, setIsEdit] = useState(false);
  const { group, setGroup } = useGroup();
  const [label, setLabel] = useState(current.label);

  useEffect(() => {
    group.id !== current.id && setIsEdit(false);
  }, [group]);
  return (
    <div
      style={{ width: "100%", height: LEFT_TAB_ITEM_HEIGHT }}
      className={`border-solid border-b-2 border-b-slate-200 flex justify-between items-center px-2 ${
        group.id === current.id && "bg-slate-200"
      }`}
      onClick={() => {
        console.log(current);
        setGroup(current);
      }}
    >
      <Checkbox />
      {isEdit ? (
        <Input
          value={label}
          style={{
            flex: "1 1 0%",
            marginLeft: "0.5rem",
            marginRight: "0.5rem",
            borderColor: "#243c5a",
          }}
          onChange={(e) => {
            setLabel(e.target.value);
          }}
          onPressEnter={() => {
            setLabel(label);
            setIsEdit(false);
          }}
        />
      ) : (
        <span className="flex-1 inline-block px-[17px] overflow-clip whitespace-nowrap">
          {label}
        </span>
      )}
      {isEdit ? (
        <div className={`flex justify-between transition-all space-x-2 `}>
          <CheckOutlined
            onClick={() => {
              setIsEdit(false);
            }}
          />
          <CloseOutlined onClick={() => setIsEdit(false)} />
        </div>
      ) : (
        <div
          className={`flex justify-between transition-all space-x-2 ${
            group.id === current.id ? "opacity-100" : "opacity-0"
          }`}
        >
          <EditOutlined onClick={() => setIsEdit(true)} />

          <Popconfirm
            title="Delete the Group"
            description="Are you sure to delete this group?"
            onConfirm={() => {
              console.log("delete");
            }}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined />
          </Popconfirm>
        </div>
      )}
    </div>
  );
}
