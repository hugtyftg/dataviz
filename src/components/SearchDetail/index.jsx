import React, { Fragment } from 'react'
import { useSelector } from 'react-redux'
import { dataSets } from '../../utils/getData'
import "./index.css"

export default function SearchDetail() {

    const dataName = useSelector(state => state.option.dataName)
    const datasource = dataSets[dataName]
    const searchIps = useSelector(state => state.searchInfo.value)



    const nodes = datasource.nodes
    if (!searchIps) {
        return
    }

    const [firstIp, secondIp] = searchIps.split('/')
    const firstNode = nodes.find(node => node.mgmt_ip === firstIp)
    const secondNode = nodes.find(node => node.mgmt_ip === secondIp)

    return (
        <div id="searchdetail" style={{ marginLeft: '10px' }}>
            {!firstNode ? null : (
                <Fragment>
                    <h3 style={{ textAlign: 'center' }}>First Node</h3>
                    <table >
                        <tbody>
                            {Object.entries(firstNode).map(([key, value], i) => {
                                if (i <= 5) {
                                    return (
                                        <tr key={key}>
                                            <th key={`th${key}_${i}`}>{key}</th>
                                            <td key={`td${key}_${i}`}>: {value.toString()}</td>
                                        </tr>
                                    )
                                }

                            })}
                        </tbody>
                    </table>
                </Fragment>
            )
            }

            <br />
            {!secondNode ? null : (
                <Fragment>
                    <h3 style={{ textAlign: 'center' }}>Second Node</h3>
                    <table>
                        {Object.entries(secondNode).map(([key, value], i) => {
                            if (i <= 5) {
                                return (
                                    <tr>
                                        <th>{key}</th>
                                        <td>: {value.toString()}</td>
                                    </tr>
                                )
                            }

                        })}
                    </table>
                </Fragment>
            )
            }



        </div >
    )
}
