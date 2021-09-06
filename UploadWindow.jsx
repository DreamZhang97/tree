import React from "react";
import {Form, Button, Input, Steps, Icon, Select, Upload, message, Modal,DatePicker,Spin} from 'antd'
const {Step}=Steps;
const {Dragger} =Upload
const { Option} = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
import TreeTransfer from "./TreeTransfer";
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

const dataList=[];
let timeOut;
class UploadWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            current: 0,
            fileTag: props.fileTag || [] ,
            secLevel:[
                {
                id:'1', level:'非密'
                },{
                id:'2', level:'秘密'
                },{
                id:'3', level:'机密'
               }
            ],
            treeData:props.treeData || [],
            targetKeys: [],
            fileList:[],
            timeRange: '',
            form:Object.assign({},props.init_form),
            visible:props.visible,
            flatTreeData:[],
            //展开的key
            expandedKeys: [],
            //穿梭框-搜索框-左/右
            dir:'',
            autoExpandParent:false,
            searchVal:'',
            subNodesTree:props.subNodesTree || []  ,
            //异步加载
            isLoading:props.isLoading,
            option:props.option,
            init_form: props.init_form || {},
            relationList:props.relationList ||[],
        };
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.done = this.done.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.changeSelect = this.changeSelect.bind(this);
        this.handleChangeForm = this.handleChangeForm.bind(this);
        this.transVisible = this.transVisible.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.closeUploadWindow=this.closeUploadWindow.bind(this);
        this.handleSearch=this.handleSearch.bind(this);
        this.getParentKey=this.getParentKey.bind(this);
        this.onExpand=this.onExpand.bind(this);
        this.transForm=this.transForm.bind(this);
        this.rangeTimeFormat=this.rangeTimeFormat.bind(this);
        this.handleVisible = this.handleVisible || null;
        this.handleForm=this.handleForm||null;
        this.beforeUpload=this.beforeUpload.bind(this);
        this.removeFile=this.removeFile.bind(this);
        this.handleFlatTreeData=this.handleFlatTreeData.bind(this);
        this.onLoadData=this.onLoadData.bind(this);
        this.getterSubData=this.getterSubData || null;
        this.getFileTag=this.getFileTag || null;
        }
    componentWillReceiveProps(nextProps, nextContext) {
        // console.log("upload组件nextProps:",nextProps);
        const {option,relationList,isLoading,fileTag}=nextProps;
        if(nextProps.visible!=null && nextProps.visible!=this.state.visible){
            this.setState({
                visible:nextProps.visible,
            })
        }

        if(fileTag!== null && fileTag!==[] && fileTag!==this.state.fileTag){
            this.setState({
                fileTag,
            })
        }
        if(relationList!==[] && relationList!==this.state.relationList){
            this.setState({
                relationList
            })
        }
        if(option!==[] &&option!==this.state.option){
            this.setState({
                option,
                form:Object.assign({},nextProps.init_form),
                init_form:nextProps.init_form
            })
        }
        if(nextProps.subNodesTree !== null && nextProps.subNodesTree!==this.state.subNodesTree){
            this.setState({
                subNodesTree:nextProps.subNodesTree,
            })
        }
        if(isLoading!=null && isLoading!== this.state.isLoading){
            this.setState({
                isLoading
            })
        }

        if(nextProps.treeData!==null  && nextProps.treeData!==this.state.treeData){
            console.log("nextProps.treeData",nextProps.treeData);
            this.setState({
                treeData:nextProps.treeData,
            },()=>{
                this.handleFlatTreeData(nextProps.treeData);
            })
        }
    }
    next() {
        if(this.state.form.file==='' || this.state.form.file===null){
            message.error('请选择一个文件')
        }else{
            this.props.form.validateFields((err) => {
                // console.log("value",value);
                // console.log(err);
                if (!err) {
                    // console.info("success");
                    this.setState({
                        current: ++this.state.current
                    });
                } else {
                    message.error('请按照要求输入所有选项！')
                }
            });
        }
    }
    prev() {
        this.setState({
            current: --this.state.current
        });
    }
    // 向父组件传值
    transVisible() {
        if (this.props.handleVisible) {
            this.props.handleVisible(false)
        }
    }
    transForm(){
        if(this.props.handleForm){
            this.props.handleForm(this.state.form)
        }
    }
    //提交表单
    done() {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('完成提交,当前的form数据为：', this.state.form);
                this.transForm();
                this.closeUploadWindow();
            } else {
                console.log('错误！!');
            }
        });
    }
    //关闭model窗口
    closeUploadWindow() {
        this.transVisible();
        this.resetForm();

    }
    //重置表单
    resetForm() {
        //清除所有的表单域
        this.props.form.resetFields();
        this.setState({
            form: Object.assign({},this.state.init_form),
            current: 0,
            targetKeys: [],
            fileList: [],
            expandedKeys:[],
        })
    }

    //文本框改变时
    handleChange(val, options) {
        // console.log('value:', val, "options", options);
        const attrName = options.props.name;
        // console.log("属性名称：", attrName);
        let form = Object.assign({}, this.state.form, {[attrName]: val});
        this.setState({
            form
        });
    }

    //格式化日期 赋值formData
    rangeTimeFormat(data,dataString){
      console.log("格式化时间:dataString:",dataString);
      const temp_form=this.state.form;
      temp_form.sealTime=moment(dataString[0]);
      temp_form.decryptionTime=moment(dataString[1]);
      this.setState({
          timeRange: dataString ? moment(dataString): null,
          form:temp_form
      })
    }

    handleChangeForm(e) {
        const attrName = e.target.name;
        let value = e.target.value;
        let tempData = Object.assign({}, this.state.form, {[attrName]: value.trim()});
        this.setState({
            form: tempData
        })
    }

    changeSelect(targetKeys) {
        console.log('upload  Target Keys:', targetKeys);
        for(let i=0;i<targetKeys.length;i++){
            //转为数字
            targetKeys[i]=+targetKeys[i];
        }
        console.log("转换后的：",targetKeys)
        this.setState({
            targetKeys: targetKeys
        })
        //更新form中的targetKeys
        let tem_form = this.state.form;
        tem_form.notes = targetKeys
        this.setState({form: tem_form});
    }

    //文件上传前
    beforeUpload(file) {
        // console.log("当前的file:", file);
        //文件大小 不能超20M
        if(file.size >  20971520){
           message.error('选择的文件大小不能超过20MB');
           return false;
        }else{
            const temp_fileList=[];
            temp_fileList.push(file);
            const temp_obj=this.state.form;
            temp_obj.file=temp_fileList[0];
            this.setState({
                fileList: temp_fileList,
                form:temp_obj
            })
            return true
        }
    }

    //移除文件
    removeFile(file){
      const temp_form=this.state.form;
      temp_form.file=''
      this.setState({
          fileList:[],
          form:temp_form
      },()=>{})
    }

    //找到节点的父节点
    getParentKey (key, tree) {
        let parentKey;
            for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children) {
                if (node.children.some((item) => item.key === key)) {
                    parentKey = node.key;
                } else if (this.getParentKey(key, node.children)) {
                    parentKey = this.getParentKey(key, node.children);
                }
            }
        }
        return parentKey;
    };

    //拍平treeData
    handleFlatTreeData(data){
        for (let i = 0; i < data.length; i++) {
            const node = data[i];
            const { key,title,children } = node;
            dataList.push({ key, title,children});
            if (node.children) {
                this.handleFlatTreeData(node.children);
            }
        }
        this.setState({
            flatTreeData:dataList
        })
    }

    //穿梭框 搜索
    handleSearch(dir,val){
        this.setState({
            dir,
            searchVal:val
        });
        if(dir == 'left' && val!==''){  //左边穿梭框
            //设置展开的
            let flag=0;
            const expandedKeys = this.state.flatTreeData
                .map((item) => {
                    if (item.title.indexOf(val) > -1) {
                        flag++;
                        return this.getParentKey(item.key, this.state.treeData);
                    }
                    return null;
                })
                .filter((item, i, self) => item && self.indexOf(item) === i);
            // console.log("expandedKeys",expandedKeys);
            this.setState({
                expandedKeys,
                autoExpandParent:true
            },()=>{
                clearTimeout(timeOut);
                if(expandedKeys.length==0 && flag==0){
                    timeOut=setTimeout(()=>{
                        message.warning('没有查询到任何数据',1);
                    },1000);
                }
            })

        }
    }

    //穿梭框 树展开
    onExpand (expandedKeys){
        // console.log(expandedKeys);
        this.setState({
            expandedKeys,
            autoExpandParent: false,
        });
    };

    onLoadData(treeNode){
        const promise= new Promise(resolve=>{
            // console.log('treeNode.props:',treeNode.props);
           if (treeNode.props.children && treeNode.props.children.length!==0) {
               resolve();
               return;
           }
           let subNodesTree = new Array()
           if (this.props.getterSubData) {
               this.props.getterSubData(treeNode.props.dataRef.title, treeNode.props.eventKey);
           }
           let loop = setInterval(() => {
               if (this.props.subNodesTree && this.props.subNodesTree.length > 0) {
                   // console.log("subNodeTree");  获取到的子节点
                   subNodesTree = [...this.props.subNodesTree];
                   for (let item in subNodesTree) {
                       //判断subNodesTree[item]这一组的key（相当于parentKey），是不是当前这一项的key
                       if (subNodesTree[item].key === treeNode.props.eventKey) {
                           //子节点添加一些属性，在页面渲染时会用到
                           for (let i in subNodesTree[item].value) {
                               subNodesTree[item].value[i].checkable = true;
                               subNodesTree[item].value[i].isLeaf = true;
                               subNodesTree[item].value[i].switcherIcon = <Icon type='zhihu-circle' theme='filled'/>;
                           }
                           //将封装好的subNodesTree[item].value塞到当前节点的children属性下
                           treeNode.props.dataRef.children = [...subNodesTree[item].value];
                           // console.log("this.state.treeDate:",this.state.treeData);
                           this.setState({
                               treeData: [...this.state.treeData],
                           }, () => {
                               resolve();
                               this.handleFlatTreeData(this.state.treeData);
                               clearInterval(loop)
                           });
                       }
                   }
               }

           }, 500)
        });
          return promise;
    }

    render() {
        let {current, fileTag, targetKeys, form,visible,expandedKeys,autoExpandParent,searchVal,secLevel,fileList,flatTreeData,isLoading,option,relationList,dir} = this.state
        const {getFieldDecorator} = this.props.form;
        return (
            <div style={{backgroundColor:"rgba(0,0,0,.5)"}}>
                <Modal title="上传文件" visible={visible} footer={null}  width={500} onCancel={this.closeUploadWindow} maskStyle={{backgroundColor:"rgba(0,0,0,.5)"}} >
                    <Spin spinning={isLoading} style={{ backgroundColor:"rgba(0,0,0,.011)"}}>
                    <div style={{"height": '450px'}}>
                        {/* 步骤条*/}
                        <Steps current={current}>
                            <Step title="步骤一" description="上传文件"/>
                            <Step title="步骤二" description="填写信息"/>
                            <Step title="步骤三" description="选择本体"/>
                        </Steps>
                        <div className='step-content'>
                            <Form name="upload_form">
                                {
                                    (() => {
                                        if (current === 0) {
                                            return (
                                                <div>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent:'space-between',
                                                        alignItems: 'center',
                                                        margin: '20px 0px 0px 0px'
                                                    }}>
                                                      <Form.Item label="密 级：" style={{ display: 'flex',
                                                          justifyContent: 'flex-start',
                                                          alignItems: 'center'}}>
                                                        {getFieldDecorator('secLevel', {
                                                            initialValue: form.secLevel,
                                                            rules: [{required: true, message: '请选择密级'}]
                                                        })(<Select  placeholder="请选择密级" style={{width: 150}}
                                                                    setFieldsValue={form.secLevel}
                                                                    onChange={this.handleChange}
                                                                   >
                                                            {
                                                                secLevel.map(item => <Option key={item.id}
                                                                                              name="secLevel"
                                                                                              value={item.level}
                                                                                               >{item.level}</Option>)
                                                            }
                                                        </Select>)}
                                                    </Form.Item>
                                                        <Form.Item label={"归属本体："} style={{ display: 'flex',
                                                           justifyContent: 'flex-start',
                                                           alignItems: 'center'}}>
                                                        {getFieldDecorator('fileTag', {
                                                            initialValue: form.fileTag ? form.fileTag: undefined,
                                                            rules: [{required: true, message: '请选择归属本体'}]
                                                        })(<Select
                                                            placeholder="请选择归属本体"
                                                            style={{width: 150,display:'block'}}
                                                            onChange={this.handleChange}
                                                        >
                                                            {
                                                                fileTag.map(item => <Option key={item.dicCode}
                                                                                              name="fileTag"
                                                                                              value={item.dicValue}
                                                                                             >{item.dicValue}</Option>)
                                                            }
                                                        </Select>)}
                                                    </Form.Item>
                                                    </div>
                                                    <div style={{display:'flex',justifyContent:'flex-start',alignItems:'center',margin:'20px 0 30px'}}>
                                                        时 间：<Form.Item >
                                                        <RangePicker
                                                            disabled={form.secLevel=='非密'}
                                                            defaultValue={[moment(new Date()),moment(new Date())]}
                                                            name="timeRange"
                                                            style={{width:'400px'}}
                                                            onChange={this.rangeTimeFormat}
                                                    />
                                                    </Form.Item>
                                                    </div>
                                                    <Form.Item label={""}>
                                                        {getFieldDecorator('file', {
                                                            initialValue: form.file,
                                                            rules: [{required: true, message: '请选择一个文件上传'}]
                                                        })(
                                                            <Dragger name='file' multiple={false}
                                                                     className="upload_container"
                                                                     type="file" fileList={fileList}
                                                                     beforeUpload={this.beforeUpload}
                                                                     onRemove={this.removeFile}
                                                                     accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
                                                        >
                                                            <p className="ant-upload-drag-icon">
                                                                <Icon type="inbox"/>
                                                            </p>
                                                            <p className="ant-upload-text">点击或将文件拖拽到这里上传</p>
                                                            <p className="ant-upload-hint">
                                                                只支持扩展名：.doc .docx .xls .xlsx .ppt .pptx .pdf
                                                            </p>
                                                        </Dragger>
                                                        )}
                                                    </Form.Item>
                                                </div>)
                                        }
                                        else if (current === 1 && option==0 ) {
                                            return (<div style={{marginTop: '10px'}}>
                                                <Form.Item label='目标描述:' style={{height: '97px'}}>
                                                    {getFieldDecorator('eventContent', {
                                                        initialValue: form.eventContent,
                                                        rules: [{required: true, message: '必填项'},
                                                            {pattern:/^(?!(\s+$))/, message: '输入项不能全为空'}
                                                        ],
                                                    })(<TextArea setFieldsValue={form.eventContent}
                                                                 style={{resize:'none'}}
                                                                 name="eventContent"
                                                                 onChange={this.handleChangeForm} placeholder="XX机组"/>)}
                                                </Form.Item>
                                                <Form.Item label='原因分析:' style={{height: '97px'}}>
                                                    {getFieldDecorator('eventReason', {
                                                        initialValue: form.eventReason,
                                                        rules: [{required: true, message: '必填项'},{
                                                            pattern:/^(?!(\s+$))/,
                                                            message:'输入项不能全为空字符'
                                                        }],
                                                    })(<TextArea  setFieldsValue={form.eventReason}
                                                                 style={{resize:'none'}}
                                                                 name='eventReason' onChange={this.handleChangeForm}
                                                                 placeholder="原因分析"/>)}
                                                </Form.Item>
                                                <Form.Item label=' 处理措施：' style={{height: '80px'}}>
                                                    {getFieldDecorator('eventHand', {
                                                        initialValue: form.eventHand,
                                                        rules: [{required: true, message: '必填项'},
                                                            {pattern:/^(?!(\s+$))/, message: '输入项不能全为空'}],
                                                    })(<Input setFieldsValue={form.eventHand}
                                                              allowClear="true"
                                                              name="eventHand"
                                                              onChange={this.handleChangeForm}
                                                              placeholder='如：新型号XX泵通过XXX，不存在该问题'/>)}
                                                </Form.Item>
                                                <Form.Item label='经验反馈：'>
                                                    {getFieldDecorator('eventSummary', {
                                                        initialValue: form.eventSummary,
                                                        rules: [{required: true, message: '必填项'},
                                                                {pattern:/^(?!(\s+$))/, message: '输入项不能全为空'}
                                                        ],
                                                    })(<Input placeholder='如：新型号XX泵通过XXX，不存在该问题'
                                                              allowClear="true"
                                                              name="eventSummary"
                                                              setFieldsValue={form.eventSummary}
                                                              onChange={this.handleChangeForm}/>)}
                                                </Form.Item>
                                            </div>)
                                        }
                                        else if(current ===1 && option==1){
                                            return (<div style={{marginTop: '20px'}}>
                                                <Form.Item label='作者:' style={{height: '97px'}}>
                                                    {getFieldDecorator('author', {
                                                        initialValue: form.author,
                                                        rules: [{required: true, message: '必填项'},
                                                            {pattern:/^(?!(\s+$))/, message: '输入项不能全为空'}
                                                        ],
                                                    })(<Input setFieldsValue={form.author}
                                                              name="author"
                                                              allowClear="true"
                                                              onChange={this.handleChangeForm}
                                                              placeholder='如：张三丰'/>)}
                                                </Form.Item>
                                                <Form.Item label='文件描述:' style={{height: '97px'}}>
                                                    {getFieldDecorator('content', {
                                                        initialValue: form.content,
                                                        rules: [{required: true, message: '必填项'},
                                                            {pattern:/^(?!(\s+$))/, message: '输入项不能全为空'}
                                                        ],
                                                    })(<TextArea setFieldsValue={form.content}
                                                                 style={{height:'190px',resize:'none'}}
                                                                 name='content' onChange={this.handleChangeForm}
                                                                 placeholder="如XX泵机组XX试验阶段，先后出现了如下问题：
                                                                              XXX年XX月XX日用XX试验的单机XX异常XXX年XX月--XX年XX月XX试验时2机组运行异常"/>)}
                                                </Form.Item>
                                            </div>)
                                        } else if (current === 2) {
                                            return (<div>
                                                    <div style={select_style}>
                                                      <Form.Item label="关系名称：" style={{
                                                          display: 'flex',
                                                          justifyContent: 'flex-start',
                                                          alignItems: 'center'
                                                      }}>
                                                        {getFieldDecorator('relationships', {
                                                            initialValue: form.relationships,
                                                            rules: [{required: true, message: '请选择关系'}]
                                                        })(<Select placeholder="请选择关系" style={{width: 120}}
                                                                   onChange={this.handleChange}
                                                                   setFieldValue={form.relationships}
                                                            >
                                                                {
                                                                    relationList.map(item => <Option key={item.dicCode}
                                                                                                     name='relationships'
                                                                                                     >{item.dicValue}</Option>)
                                                                }
                                                            </Select>
                                                        )}
                                                    </Form.Item>
                                                    </div>
                                                    <Form.Item>
                                                              <TreeTransfer dataSource={this.state.treeData}
                                                                            onLoadData={this.onLoadData}
                                                                            name='notes'
                                                                            targetKeys={targetKeys}
                                                                            onChange={this.changeSelect}
                                                                            onSearch={this.handleSearch}
                                                                            expandedKeys={expandedKeys}
                                                                            autoExpandParent={autoExpandParent}
                                                                            onExpand={this.onExpand}
                                                                            searchVal={searchVal}
                                                                            dir={dir}
                                                              />
                                                    </Form.Item>
                                                </div>
                                            )
                                        }
                                    })()
                                }
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0px',
                                    left: '50%',
                                    transform: 'translate(-50%,0)'
                                }}>{
                                        current > 0 && (
                                            <Button type="primary" style={{marginRight: '10px'}}
                                                    onClick={() => this.prev()}>上一步</Button>)
                                    }
                                    {current < 2 && (
                                        <Button type="primary" style={{marginRight: '10px'}}
                                                onClick={() => this.next()}>下一步</Button>)
                                    }
                                    {
                                        current >= 2 && (
                                            <Button type="primary" onClick={this.done}>完成</Button>)
                                    }
                                </div>
                            </Form>
                        </div>
                    </div>
                    </Spin>
                </Modal>
            </div>
        )
    }
};

const select_style={
    display:'flex',
    justifyContent:'flex-end',
    alignItems:'center',
    margin:'10px 0'
}
const UploadForm =Form.create({name:'upload_form'})(UploadWindow)
export default  UploadForm