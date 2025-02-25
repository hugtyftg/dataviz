import React, { useEffect, useLayoutEffect } from 'react'
import "./index.css"
import * as d3 from "d3"
import { useSelector } from 'react-redux'
import { SETTING } from "./constant"
import { dataSets } from '../../utils/getData'
import { handleData } from '../../utils/handleData'
import BubbleDetailLegend from './BubbleDetailLegend'

let simulation

export default function BubbleDetail() {

    const dataName = useSelector(state => state.option.dataName)
    const data = handleData(dataSets[dataName])

    const drawInfo = useSelector(state => state.bubble.drawInfo)
    let nodes = []
    let links = []


    useLayoutEffect(() => {
        initSvg()
    }, [])

    useEffect(() => {
        d3.select('#bubblesvg').select('*').remove()
        getDrawData(drawInfo)
        drawLayout()
    }, [drawInfo])





    const initSvg = () => {
        const width = document.querySelector('#bubbleDetailContainer').clientWidth
        const height = document.querySelector('#bubbleDetailContainer').clientHeight
        const svgContainer = d3.select('#bubbleDetailContainer').append('svg')
            .attr('id', 'bubbleDetailsvgContainer')
            .attr('class', 'bubbleDetailsvgContainer')
            .attr('width', width - 100)
            .attr('height', height - 100)

        const svg = svgContainer.append('g')
            .attr('id', 'bubblesvg')
            .attr('class', 'bubblesvg')
        // .attr('transform', 'translate(0,100)')

        let zoomObj = d3.zoom()
            .scaleExtent([1 / 50, 2])

        svgContainer.call(
            zoomObj.on('zoom', e => {
                let { k, x, y } = e.transform;
                d3.select('#bubblesvg').style('transform', `translate(${x}px, ${y}px) scale(${k})`);
            })
            // zoomObj.on('zoom', e => {
            //     svg.attr('transform', d3.zoomTransform(d3.select('#svgContainer').node()))
            // })

        )

        document.onkeydown = (e) => {
            if (e.keyCode === 17) {
                autoZoom(
                    zoomObj,
                    'bubbleDetailsvgContainer',
                    'bubblesvg',
                    {
                        row: 50,
                        col: 100
                    },
                    1000
                )
            }

        }

    }


    const autoZoom = (zoomObj, svgContainerId, svgBodyId, marginParam, duration) => {

        const svgContainer = document.querySelector(`#${svgContainerId}`);
        const svgBody = d3.select(`#${svgBodyId}`);

        const viewBox = svgBody.node().getBBox();//g
        //svg
        const containerWidth = svgContainer.clientWidth
        const containerHeight = svgContainer.clientHeight
        // margin setting
        const rowMargin = marginParam.row
        const colMargin = marginParam.col

        const scale = Math.min((containerWidth - rowMargin) / viewBox.width, (containerHeight - colMargin) / viewBox.height)

        const offsetX = (containerWidth - rowMargin) / 2 - (viewBox.x + viewBox.width / 2) * scale
        const offsetY = (containerHeight - colMargin) / 2 - (viewBox.y + viewBox.height / 2) * scale

        // d3.zoomIdentity:缩放参数，返回Transform{k:1,x:0,y:0}
        const t = d3.zoomIdentity.translate(offsetX, offsetY).scale(scale)
        d3.select(`#${svgContainerId}`).transition().duration(duration).call(zoomObj.transform, t)
    }

    const getDrawData = (drawInfo) => {
        if (!Object.keys(drawInfo).length) {
            return
        }
        if (drawInfo.hasOwnProperty('pod')) {
            //如果有pod，必有az
            nodes = data.nodes.filter(node => (node.az === drawInfo.az && node.pod_name === drawInfo.pod))
            links = data.links.filter(link => {
                return (nodes.findIndex(node => node.mgmt_ip === link.src_ip) >= 0 && nodes.findIndex(node => node.mgmt_ip === link.dst_ip) >= 0)
            })

        } else if (drawInfo.hasOwnProperty('az')) {
            //没有pod但是有az
            nodes = data.nodes.filter(node => node.az === drawInfo.az)
            links = data.links.filter(link => {
                return (nodes.findIndex(node => node.mgmt_ip === link.src_ip) >= 0 && nodes.findIndex(node => node.mgmt_ip === link.dst_ip) >= 0)
            })
        } else {
            return
        }
    }


    const drawLayout = () => {
        const svg = d3.select('#bubblesvg')
        svg.select('*').remove()

        if (!nodes.length) {
            return;
        }
        const height = document.querySelector("#bubbleDetailContainer").clientHeight
        const width = document.querySelector("#bubbleDetailContainer").clientWidth


        //FIXME: 先添加link，再添加circle，可以保证连边在circle的下层
        const linkLine = svg.append('g')
            .attr('class', 'links')
            .attr('id', 'links')
            .selectAll('.linkG')
            .data(links)
            .join('line')
            .attr('class', 'link')
            .attr('id', d => `${d.source.mgmt_ip}_${d.target.mgmt_ip}`)
            .attr('stroke', d => d.stroke || SETTING.fill.stroke)
            .attr('stroke-width', d => d.stokeWidth || SETTING.size.linkStrokeWidth)


        const nodeG = svg.append('g')
            .attr('class', 'nodes')
            .attr('id', 'nodes')
            .selectAll('.nodeG')
            .data(nodes)
            .join('g')
            .attr('class', 'nodeGroup')
            .attr('id', d => `${d.mgmt_ip}_group`)


        const fixNodes = (curNode) => {
            nodes.forEach(function (d) {
                if (curNode !== d) {
                    d.fx = d.x;
                    d.fy = d.y;
                }
            });
        }



        const getShape = (d) => {
            switch (d.role.toLowerCase()) {
                case "core":
                    return d3.symbolStar;
                case "spine":
                    return d3.symbolTriangle;
                case "leaf" || "tor":
                    return d3.symbolCircle;
                default:
                    return d3.symbolSquare
            }
        }

        const getSize = (d) => {
            return d.is_alarming ? SETTING.size.symbolSize * 3 : SETTING.size.symbolSize
        }

        let nodeSymbol = nodeG
            .append('path')
            .attr('d', d3.symbol().type(getShape).size(getSize))
            .attr('fill', d => d.is_alarming ? SETTING.fill.alarmingNode : SETTING.fill.normalNode)
            // .append('circle')
            // .attr('class', 'nodeSymbol')
            // .attr('class', ' alarming')
            // .attr('id', d => `ip_${d.mgmt_ip.replaceAll('.', "")}`)
            // .attr('r', SETTING.size.nodeRadius)
            // .attr('fill', d => SETTING.fill[d.role.toLowerCase()])
            .call(
                d3.drag()
                    .on('start', event => {
                        //d3.event.active代表的是除去当前事件，当前正在发生的拖动事件的个数。
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        event.subject.fx = event.subject.x;
                        event.subject.fy = event.subject.y;
                    })
                    .on('drag', event => {
                        event.subject.fx = event.x;
                        event.subject.fy = event.y;
                        if (SETTING.dragMode.flag) {
                            fixNodes(event.subject)
                        }
                    })
                    .on('end', event => {
                        // simulation.alphaTarget(simulation.alphaMin() * 0.1).restart()
                        simulation.alphaTarget(0.3).restart()
                    })
            );




        simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(d => d.is_alarming ? SETTING.size.nodeRadius * 3 : SETTING.size.nodeRadius).strength(0.8))
            //设定forceX与forceY使得它们更加聚拢在中间位置
            //FIXME:调整了strength
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("link", d3.forceLink(links).id(d => {
                return d.mgmt_ip
            }).strength(0.5).distance(10))
            .on("tick", () => {
                linkLine.attr("x1", function (d) { return parseInt(d.source.x); })
                    .attr("y1", function (d) { return parseInt(d.source.y); })
                    .attr("x2", function (d) { return parseInt(d.target.x); })
                    .attr("y2", function (d) { return parseInt(d.target.y); });
                nodeSymbol.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')' })
            })

    }




    return (
        <div className='bubbleDetailContainer' id="bubbleDetailContainer">
            <BubbleDetailLegend />
        </div>
    )
}
