import React, { Component } from "react";

export default class CompanyAndPosi extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { 
      item,
      type,
    } = this.props;

    if (!item) {
      return null;
    }

    let companyPath = '';
    let hrmUserName = item.base_user_name;

    let isDefault = false;
    let isApp = false;
    if (item.user_type === 2) { // 不是群组，是应用消息
      isApp = true;
    }

    if (item && item.user_type === 1 && item.userlist && item.userlist.length > 0) {
      let firstUser;

      if (item.main_tenant_id) {
        firstUser = item.userlist.filter(v => v.tenant_id === item.main_tenant_id)[ 0 ];
      } else {
        // 没有权限看主企业，只能看第一个
        firstUser = item.userlist[ 0 ];
      }

      // 判断是不是默认企业
      if (item.userlist.length === 1 && firstUser.tenant_id == 1) {
        isDefault = true;
      }

      if (isDefault) {
        hrmUserName = ''; // 默认企业不显示名字
      } else {
        hrmUserName = firstUser.name;
      }

      const firstDept = firstUser.deptlist[0];
      if (firstDept && firstDept.path) {
        let pathDummy = firstDept.path;
        // 默认企业去掉公司名字，只显示部门和职位
        if (isDefault && pathDummy.length > 1) {
          pathDummy = pathDummy.slice(1); // 去掉第一个
        }

        if (type === 'onlyDept') {   // 只显示我的部门
          companyPath = pathDummy[pathDummy.length - 1];
        } else {
          companyPath = pathDummy.map((v, i) => {
            if (i == pathDummy.length - 1) {
              return v;
            }

            return `${v} / `;
          }).join('');
        }
      }

      companyPath = `${companyPath}${firstUser.position ? `<b>${firstUser.position}</b>` : ''}`
    }
    
    return !isDefault 
            ? !isApp
              ? companyPath 
                ? <p>{hrmUserName}（<span dangerouslySetInnerHTML={{ __html: companyPath }} />）</p> 
                : null
              : <p>{item.tenant_info.tenant_name}</p>
            : <p dangerouslySetInnerHTML={{ __html: companyPath }} />
  }
}

CompanyAndPosi.defaultProps = {
  item: {},
  type: 'normal'
};
