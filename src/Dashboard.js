import { useState, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import useAuth from './useAuth'
import Player from './Player'
import SpotifyWebApi from 'spotify-web-api-node';
import TrackSearchResult from './TrackSearchResult'
import axios from 'axios';
const spotifyAPI = new SpotifyWebApi({
    clientId: "2429466bdb0a43089d3d7cc4a5fe5df0",
})

export default function Dashboard({ code }) {
    const accessToken = useAuth(code)
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [playingTracks, setPlayingTracks] = useState()
    const [lyrics, setLyrics] = useState("")


    function chooseTrack(track) {
        setPlayingTracks(track)
        setSearch('')
        setLyrics('')
    }

    useEffect(() =>{ 
        if(!playingTracks) return

        axios.get('http://localhost:3001/lyrics',{
            params: {
                track: playingTracks.title,
                artist: playingTracks.artist
            },
        }).then(res =>{
            setLyrics(res.data.lyrics)
        })

    },[playingTracks])

    useEffect(() => {
        if (!accessToken) return
        spotifyAPI.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
        if (!search) return setSearchResults([])
        if (!accessToken) return
        let cancel = false
        spotifyAPI.searchTracks(search).then(res => {
            if (cancel) return
            setSearchResults(res.body.tracks.items.map(track => {

                const smallestAlbumImage = track.album.images.reduce((smallest, image) => {
                    if (image.height < smallest.height) return image
                    return smallest
                }, track.album.images[0])
                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url

                }
            }))
        })
        return () => cancel = true
    }, [search, accessToken])

    return (
        <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
        <Form.Control
          type="search"
          placeholder="Search Songs/Artists"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
          {searchResults.map(track => (
            <TrackSearchResult
              track={track}
              key={track.uri}
              chooseTrack={chooseTrack}
            />
          ))}
          {searchResults.length === 0 && (
            <div className="text-center" style={{ whiteSpace: "pre" }}>
              {lyrics}
            </div>
          )}
        </div>
        <div>
          <Player accessToken={accessToken} trackUri={playingTracks?.uri} />
        </div>
      </Container>


    )
}
