import {
  Button,
  Checkbox,
  FloatButton,
  Input,
  Popover,
  Select,
  Space,
  Tabs,
  TabsProps,
  Tooltip,
} from "antd";
import * as React from "react";
import {
  EMPTY_GROUP,
  EMPTY_RULE,
  HOME_HEIGHT,
  LEFT_TAB_ACTION_HEIGHT,
  LEFT_TAB_BAR_HEIGHT,
  LEFT_TAB_ITEM_HEIGHT,
} from "../utils/constants";

import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  OrderedListOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  AppstoreAddOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import Item from "../components/item";
import { useCallback, useEffect, useState } from "react";
import { generateId, noop } from "../utils";
import { ACTION, STATUS, TYPE } from "../utils/types";
import { useGroup, useRule, useSelected } from "../utils/store";
import {
  addGroup,
  addRule,
  getLocalGroups,
  getLocalRules,
  getLocalSelected,
} from "../utils/storage";

// function Groups() {
//   // const groups = new Array(30).fill(null).map((_, idx) => ({
//   //   id: idx,
//   //   label: Math.random().toString(36).substring(2, 10),
//   //   children: [],
//   // }));

//   return;
// }

// function Rules() {
//   // const groups = new Array(30).fill(null).map((_, idx) => ({
//   //   id: idx,
//   //   label: Math.random()
//   //     .toString(36)
//   //     .substring(2, Math.max(33 * Math.random(), 3)),
//   //   children: [],
//   // }));

//   return;
// }

const actionView = {
  [ACTION.Add]: { label: "add", icon: <PlusCircleOutlined /> },
  [ACTION.Search]: {
    label: "search",
    icon: <SearchOutlined />,
  },
  [ACTION.OrderByName]: {
    label: "order by name",
    icon: <SortAscendingOutlined />,
  },
  [ACTION.OrderByCreateTime]: {
    label: "order by create",
    icon: <CloudUploadOutlined />,
  },
  [ACTION.OrderByUpdateTime]: {
    label: "order by update",
    icon: <CloudSyncOutlined />,
  },
};

function generatePlaceHolder(tab: TYPE, action: ACTION): string {
  if (action === ACTION.Add || action === ACTION.Search) {
    return `${actionView[action].label} a ${tab.toLowerCase()}`;
  } else {
    return `${actionView[action].label}`;
  }
}

export default function LeftBar() {
  const [action, setAction] = useState<ACTION>(ACTION.Add);
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<STATUS>(STATUS.NONE);
  const { type, setType, setSelected } = useSelected();
  const { groups, setGroups } = useGroup();
  const { rules, setRules } = useRule();

  const refresh = async () => {
    const localGroups = await getLocalGroups();
    const localRules = await getLocalRules();
    console.log(localGroups, localRules);
    setGroups(localGroups);
    setRules(localRules);
  };

  const initSelected = async () => {
    const [localSelectedType, localSelected] = await getLocalSelected();
    console.log(localSelectedType, localSelected);
    setSelected(localSelected);
    setType(localSelectedType);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      await initSelected();
    })();
  }, []);

  function handleAction() {
    const addItem = async (input: string) => {
      if (!input) {
        setStatus(STATUS.ERROR);
        setTimeout(() => {
          setStatus(STATUS.NONE);
        }, 1000);
        return;
      }
      if (type === TYPE.Group) {
        await addGroup({
          ...EMPTY_GROUP,
          name: input,
          id: generateId(),
          create: Date.now(),
          update: Date.now(),
        });
      } else {
        await addRule({
          ...EMPTY_RULE,
          name: input,
          id: generateId(),
          create: Date.now(),
          update: Date.now(),
        });
      }
      setInput("");
      await refresh();
    };
    const searchItem = (input: string) => {};
    const orderItemsByName = () => {};
    const orderItemsByCreateTime = () => {};
    const orderItemsByUpdateTime = () => {};
    const actionOper = {
      [ACTION.Add]: addItem,
      [ACTION.Search]: searchItem,
      [ACTION.OrderByName]: orderItemsByName,
      [ACTION.OrderByCreateTime]: orderItemsByCreateTime,
      [ACTION.OrderByUpdateTime]: orderItemsByUpdateTime,
    };
    actionOper[action](input);
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Tabs
        activeKey={type}
        items={[
          {
            key: TYPE.Group,
            label: TYPE.Group,
            children: (
              <div
                style={{
                  height: `calc(100vh - ${LEFT_TAB_BAR_HEIGHT}px)`,
                  paddingBottom: LEFT_TAB_ACTION_HEIGHT * 2,
                }}
                className="relative overflow-y-scroll no-scrollbar"
              >
                {groups.map((val) => (
                  <Item item={val} type={TYPE.Group} refresh={refresh} />
                ))}
              </div>
            ),
          },
          {
            key: TYPE.Rule,
            label: TYPE.Rule,
            children: (
              <div
                style={{
                  height: `calc(100vh - ${LEFT_TAB_BAR_HEIGHT}px)`,
                  paddingBottom: LEFT_TAB_ACTION_HEIGHT * 2,
                }}
                className="relative overflow-y-scroll no-scrollbar pb-4"
              >
                {rules.map((val) => (
                  <Item item={val} type={TYPE.Rule} refresh={refresh} />
                ))}
              </div>
            ),
          },
        ]}
        onChange={(v: any) => {
          setType(v);
        }}
        size="small"
        centered
        tabBarStyle={{ marginBottom: 0, height: LEFT_TAB_BAR_HEIGHT }}
        style={{ height: "100%" }}
      />
      <div
        style={{ height: LEFT_TAB_ACTION_HEIGHT }}
        className="absolute flex items-center justify-center bottom-0 w-full bg-transparent px-6 gap-2"
      >
        <Input
          placeholder={generatePlaceHolder(type, action)}
          onPressEnter={handleAction}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          status={status}
        />
        <Popover
          content={
            <div className="flex flex-col items-center">
              {Object.entries(actionView).map(([key, { label, icon }]) => (
                // todo add bg-color for tooltip
                <Tooltip placement="right" title={label}>
                  <span
                    className="block cursor-pointer"
                    // Object key is string, but enum key is number so need str2num
                    onClick={() => setAction(+key)}
                  >
                    {icon}
                  </span>
                </Tooltip>
              ))}
            </div>
          }
        >
          <Button icon={actionView[action].icon} onClick={handleAction} />
        </Popover>
      </div>
    </div>
  );
}
