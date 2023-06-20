import '../parts/cardview.scss'
import '../parts/cardsFluidGrid.scss'
import recommend_img from '../../img/recommend.png'
import { getOptimizedBucketFullSrc } from '../../util/optimizedImages';
import React, { useEffect, useState } from 'react'
import CARDCONSTANT from '../parts/CardViewerConstant';

export function Cardviewer({type, selIndex, disabled, event}) {
    const items = CARDCONSTANT.DATA[type];

    const [selectedIndex, setSelectedindex] = useState(0);
    
    const handleClick = (key, allowed, selectedType) => {
        if (!allowed){
            if(selectedIndex !== key){
                let value = true;
                switch(selectedType){
                    case CARDCONSTANT.TOGGLE.ENVOLVING:
                        value = key===0?true:false;
                        break;
                    case CARDCONSTANT.TOGGLE.ARTISTS:
                        value = key===2?true:false;
                        break;
                    case CARDCONSTANT.TOGGLE.BATCHES:
                        value = key ===0?true:false;
                        break;
                    case CARDCONSTANT.TOGGLE.MINT_COLLECTOR:
                        value = key ===0?false:true;
                        break;
                    default:
                        break;
                }

                event(value, selectedType);
            }
            setSelectedindex(key);
        }
    }

    useEffect(() => {
        let value = 0;
        switch(type){
            case CARDCONSTANT.TOGGLE.ENVOLVING:
                value = selIndex?0:1;
                break;
            case CARDCONSTANT.TOGGLE.ARTISTS:
                value = selIndex?2:0;
                break;
            case CARDCONSTANT.TOGGLE.BATCHES:
                value = selIndex?0:1;
                break;
            case CARDCONSTANT.TOGGLE.MINT_COLLECTOR:                
                value = selIndex?1:0;
                break;
            default:
                break;
        }

        setSelectedindex(value);
    // eslint-disable-next-line
    }, []);

    return (
        <>
        <div>
            <h3 className='card-header'>{items.header}</h3>
            <div className='card-block'>
                {items.cards.map((card, key) => {
                    let imagePath = `/collection-settings/${card.filename}`;
                    return(
                        <div key={key} className={"card-view" + (key===selectedIndex ? " highlight-border" : "")} disabled={disabled?true:false} onClick={() => {handleClick(key, disabled, type)}}>
                            <div className="card-img">
                                {card.recommend?<img className={card.absolute?'pos-none':"pos-absoulte"} src={recommend_img} alt=""></img>:''}
                                <img className="img-full" src={getOptimizedBucketFullSrc(imagePath, { width: 230 })} alt=""></img>
                            </div>
                            <div>
                                <h3 className='card-title'>{card.title}</h3>
                            </div>
                            <div>
                                <p className='card-content'>{card.content}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
        </>
    )
}