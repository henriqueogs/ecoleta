import React, {useEffect, useState, ChangeEvent, FormEvent } from 'react';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api'
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet'
import Dropzone from './../../components/DropZone'


import './styles.css';

interface Iten{
    id: number;
    title: string,
    image_url: string;
}

interface IBGEUFResponse{
    sigla: string;
}

interface IBGECityResponse{
    nome: string;
}


// Array ou objeto, informar manualmente o tipo da variável

const CreatePoint = () =>{
    const [itens, setItens] = useState<Iten[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    
    const [ formData, setFormdata ] = useState({
        name: '',
        email: '',
        whatspp: '',
    });

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItens, setSelectedItens] = useState<number[]> ([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position =>{
            const {latitude , longitude } = position.coords;
            setInitialPosition([latitude, longitude]);

        });
    }, []);
    useEffect(() => {
        api.get('itens').then(response =>{
           setItens(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            
            setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
        //carregar as cidades sempre que a UF mudar.
        if (selectedUf === '0'){
            return;
        }

        axios
            .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityNames = response.data.map(city => city.nome);
                setCities(cityNames);
        });
        
    }, [selectedUf]);

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;

        setSelectedUf(uf);
    }
    
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;

        setSelectedCity(city);
    }
    
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])

    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name , value } = event.target;

        setFormdata( {...formData, [name]: value });
    }

    function handleSelectIten(id: number){
        const alreadySelected  = selectedItens.findIndex(iten => iten === id);
        if(alreadySelected >= 0 ){
            const filteredItens = selectedItens.filter(iten => iten !== id);
            setSelectedItens(filteredItens)

        }else{
            setSelectedItens([ ...selectedItens, id]);

        }
    }

    async function handleSubmit(event: FormEvent ) {
        event.preventDefault(); 

        const {name, email, whatspp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude ] = selectedPosition;
        const itens = selectedItens;
        
        const data = new  FormData();

        data.append('name', name); 
        data.append('email', email); 
        data.append('whatspp', whatspp); 
        data.append('uf', uf); 
        data.append('city', city); 
        data.append('latitude', String(latitude)); 
        data.append('longitude', String(longitude)); 
        data.append('itens', itens.join(','));
        
        if(selectedFile){
            data.append('image', selectedFile);         
        }

        await api.post('points', data);
        alert ('Ponto de coleta criado');

        history.push('/')
    }



    return(
        <div id="page-create-point">
             <header>
                 <img src={logo} alt="Ecoleta"/>
                 <Link to="/">
                     <FiArrowLeft />
                     Voltar para home
                 </Link>
             </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>
                
                <Dropzone onFileUploaded = {setSelectedFile} />


                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type = "text"
                            name = "name"
                            id = "name"
                            onChange = {handleInputChange}
                        />
                        </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type = "email"
                                name = "email"
                                id = "email"
                                onChange = {handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatspp">whatspp</label>
                            <input 
                                type = "text"
                                name = "whatspp"
                                id = "whatspp"
                                onChange = {handleInputChange}
                            />
                        </div> 
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={/*[-21.0278253,-44.3248135]*/initialPosition} zoom= {15} onClick = {handleMapClick}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={selectedPosition} />
                    </Map>
                   
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select 
                                name="uf"
                                id="uf"
                                value={selectedUf}
                                onChange={handleSelectUF} 
                            >
                                <option value="0">Selecione uma UF</option>
                                   {ufs.map(uf =>(
                                       <option key={uf} value={uf}>{uf}</option>   
                                    ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city"
                                id="city"
                                value= {selectedCity}
                                onChange ={handleSelectCity}
                            >
                                    <option value="0">Selecione uma cidade</option>
                                    {cities.map(city =>(
                                       <option key={city} value={city}>{city}</option>   
                                    ))}
                            </select>
                        </div>

                    </div>

                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {itens.map(iten => (
                            <li 
                                key={iten.id} 
                                onClick ={ () => handleSelectIten(iten.id)}
                                className = {selectedItens.includes(iten.id) ? 'selected' : '' }
                            >
                                <img src= {iten.image_url} alt={iten.title} />
                                <span>{iten.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de Coleta
                </button>
            </form>

        </div>

    )
};

export default CreatePoint;