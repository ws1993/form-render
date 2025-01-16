import React, { useState, useRef } from 'react';
import { Popover } from 'antd';

const TableCell = (props: any) => {
  const { renderCore, schema, dataIndex, ...otherProps } = props;
  const [errorMsg, setErrorMsg] = useState(null);
  const [visible, setVisible] = useState<boolean>();
  const mouseRef = useRef<any>(null);

  const onStatusChange = (_: any, errors: any[]) => {
    const message = errors[0] || null;
    setErrorMsg(message);
   
    if (mouseRef.current && message) {
      setVisible(true);
    }
  };

  if (!schema.properties[dataIndex].onStatusChange) {
    schema.properties[dataIndex].onStatusChange = onStatusChange;
  }

  const popoverVisible = visible && errorMsg;
  let popoverProps: any = {
    open: popoverVisible
  };
  if ((window as any).antdVersion === 'v4')  {
    popoverProps = {
      visible: popoverVisible
    };
  }
  
  return (
    <div
      className='fr-table-cell-content'
      onMouseEnter={() => {
        mouseRef.current = true;
        setVisible(true);
      }}
      onMouseLeave={() => {
        mouseRef.current = false;
        setVisible(false);
      }}
    >
      <Popover
        overlayClassName='fr-popover-error'
        content={errorMsg}
        placement='topRight'
        {...popoverProps}
      >
        {renderCore({ ...otherProps, schema })}
      </Popover>
    </div>
  );
};

export default TableCell;
