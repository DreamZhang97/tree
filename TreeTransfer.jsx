import React from "react";
import {Transfer, Tree, Icon, Spin, Tooltip} from "antd";
const { TreeNode } = Tree;
const isChecked = (selectedKeys, eventKey) => {
    return selectedKeys.indexOf(eventKey) !== -1;
};
const generateTree = (treeNodes = [], checkedKeys = [],searchValue,dir) => {
    // console.log("treeNodes",treeNodes,"searchValue:",searchValue);
    searchValue= searchValue || "";
    for(let i=0;i<checkedKeys.length;i++){
        checkedKeys[i]=+checkedKeys[i];
    }
    return (treeNodes || [] ).map((item) => {
            item.title=item.title.substr(item.title.indexOf('_')+1);
            let index =  item.title?item.title.indexOf(searchValue):-1;
            let beforeStr = item.title?item.title.substr(0, index):null;
            let afterStr = item.title?item.title.substr(index +searchValue.length):null;
            const title =
                (index > -1 && dir=='left' )?
                    (
                        <Tooltip title={item.title}>
                          <span>
                            {beforeStr}
                            <span style={{color:"red"}}>{searchValue}</span>
                             {afterStr}
                        </span>
                        </Tooltip>
                    )
                    :
                    (
                        <Tooltip title={item.title}>
                              <span>{item.title}</span>
                        </Tooltip>
                    );

            //父节点
            if(item.hasOwnProperty('children')) {
                return (<TreeNode title={title} key={item.key} checkable={false} selectable={false} dataRef={item} >
                    {generateTree(item.children,checkedKeys,searchValue,dir)}
                </TreeNode>);
            }

            return (
                <TreeNode title={title}  key={item.key} switcherIcon={item.switcherIcon} isLeaf={item.isLeaf} disabled={checkedKeys.includes(item.key)} checkable={item.checkable ? true :false} selectable={false} dataRef={item}/>
                    )
        });

};
const TreeTransfer = ({ dataSource, targetKeys, onChange,onSearch,onExpand,expandedKeys,autoExpandParent,searchVal,onLoadData,dir}) => {
    const transferDataSource = [];
    function flatten(list = []) {
       if(list){
           list.forEach(item => {
               transferDataSource.push({key:item.key,title:item.title,checked:item.checked});
               flatten(item.children);
           });
       }
    }
    flatten(dataSource);
    return (
        <Transfer
            onChange={onChange}
            targetKeys={targetKeys}
            dataSource={transferDataSource}
            className="tree-transfer"
            titles={['实体库', '关联实体']}
            operations={['加入右侧', '加入左侧']}
            rowKey={item => item.key}
            render={item => item.title}
            showSelectAll={false}
            showSearch
            onSearch={onSearch}
            listStyle={{
                width: 173,
                height: 260,
            }}
            style={{marginTop:'20px'}}
        >
            {
                ({ direction, onItemSelect, selectedKeys }) => {
                if (direction === 'left') {
                    const checkedKeys = [...selectedKeys, ...targetKeys];
                    return (
                            <Tree
                                loadData={onLoadData}
                                checkable={true}
                                height={200}
                                blockNode
                                showLine={true}
                                checkStrictly
                                onExpand={onExpand}
                                expandedKeys={expandedKeys}
                                autoExpandParent={autoExpandParent}
                                checkedKeys={checkedKeys}
                                onCheck={(
                                    _,
                                    {
                                        node: {
                                            props: { eventKey },
                                        },
                                    },
                                ) => {
                                    onItemSelect(eventKey, !isChecked(checkedKeys, eventKey));
                                }}
                            >
                                {generateTree(dataSource, targetKeys,searchVal,dir)}
                            </Tree>
                    );
                }
            }}
        </Transfer>
    )
};
export default TreeTransfer;
