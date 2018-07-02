import React, { Component } from 'react';
import { List, Avatar, Icon } from 'antd';

export default class AgentList extends Component {
  render() {

    const listData = [];
    for (let i = 0; i < 15; i++) {
      listData.push({
        title: `工作微博`,
        time: '12:30',
        avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
        description: 'We supply a series of desigdsad adan principles ',
      });
    }


    return (
      <div className="agent-list">
        <List
          className="list-content"
          size="small"
          dataSource={listData}
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={[ <span>{item.time}</span> ]}
            >
              <List.Item.Meta
                avatar={<Avatar className="agent-avatar" src={item.avatar}/>}
                title={<span>{item.title}</span>}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </div>
    )
  }
}


