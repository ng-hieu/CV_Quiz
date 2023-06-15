import {Box, Grid, IconButton, Paper} from "@mui/material";
import {GroupFilter} from "../../components/Question/GroupFilter";
import {useEffect, useState} from "react";
import QuestionListManagement from "../../components/Question/QuestionListManagement";
import QuestionDetails from "../../components/Question/QuestionDetails";
import {customAPIv1} from "../../features/customAPI";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import * as React from "react";

export default function QuestionManagement() {
    const [selectedTagIDs, setSelectedTagIDs] = useState([]);
    const [selectedTypesIDs, setSelectedTypesIDs] = useState([]);
    const [difficultiesIDs, setDifficulties] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [listQuestion, setListQuestion] = useState([]);
    const [contentQuery, setContentQuery] = useState('');
    console.log("selectedTagIDs:", selectedTagIDs)
    console.log("selectedType:", selectedTypesIDs)
    console.log("selectedDifficulties:", difficultiesIDs);
    const filteredQuestions = listQuestion
        .filter(item => {
            return (selectedTypesIDs.length === 0 ? true :
                selectedTypesIDs.includes(item.type.id))
        })
        .filter((item) => {
            return difficultiesIDs.length === 0 ? true :
                difficultiesIDs.includes(item.difficulty.id)
        })
        .filter((item) => {
            return selectedTagIDs.length === 0 ? true :
                item.tags.some(tag => {
                    return selectedTagIDs.includes(tag.id)
                })
        })
    const handleCheckTags = (event) => {
        const {name, checked} = event.target;
        let index = selectedTagIDs.findIndex(id => id === parseInt(name));
        if (index < 0) {
            setSelectedTagIDs([...selectedTagIDs, parseInt(name)]);
        } else {
            selectedTagIDs.splice(index, 1);
            setSelectedTagIDs([...selectedTagIDs]);
        }
    };
    const handleCheckTypes = (event) => {
        const {name, checked} = event.target;
        let index = selectedTypesIDs.findIndex(id => id === parseInt(name));
        if (index < 0) {
            setSelectedTypesIDs([...selectedTypesIDs, parseInt(name)]);
        } else {
            selectedTypesIDs.splice(index, 1);
            setSelectedTypesIDs([...selectedTypesIDs]);
        }
    };
    const handleCheckDifficulties = (event) => {
        const {name, checked} = event.target;
        let index = difficultiesIDs.findIndex(id => id === parseInt(name));
        if (index < 0) {
            setDifficulties([...difficultiesIDs, parseInt(name)]);
        } else {
            difficultiesIDs.splice(index, 1);
            setDifficulties([...difficultiesIDs]);
        }

    };

    const updateQuestions = () => {
        customAPIv1().get(`/questions`, {
            params: {
                content: contentQuery,
                selectedTagIDs: selectedTagIDs,
                selectedTypesIDs: selectedTypesIDs,
                difficultiesIDs: difficultiesIDs
            }
        })
            .then(res => {
                console.log("questions:", res.data);
                setListQuestion(res.data.data);
            })
            .catch(e => console.log("error in get questions:", e))
    };
    useEffect(() => {
        console.log("edit form did mount");
        updateQuestions();
    }, [selectedTagIDs, selectedTypesIDs, difficultiesIDs])
    console.log(listQuestion);
    const [searchValue, setSearchValue] = useState('');
    const handleInputChange = (event) => {
        setSearchValue(event.target.value);
    };


    return (


        <Box sx={{
            width: '100%',
            height: '100vh',
            p: 3,

        }}>

            <Grid container spacing={3} sx={{
                // height: '90vh',
            }}>
                <Grid item xs={3}>
                    {JSON.stringify(searchValue)}
                    <Paper
                        component="form"
                        sx={{p: '2px 4px', alignItems: 'center'}}
                    >
                        <InputBase
                            sx={{ml: 3, flex: 1,width : 200}}
                            placeholder="Search Here"
                            inputProps={{'aria-label': 'search '}}
                            onChange={handleInputChange}
                            value={searchValue}
                        />
                        <IconButton type="button" sx={{ p: '10px',width :80}} aria-label="search">
                            <SearchIcon />
                        </IconButton>
                    </Paper>

                    <GroupFilter
                        handleCheckTags={handleCheckTags} selectedTagIDs={selectedTagIDs}
                        handleCheckTypes={handleCheckTypes} selectedTypesIDs={selectedTypesIDs}
                        handleCheckDifficulties={handleCheckDifficulties} difficultiesIDs={difficultiesIDs}
                    >
                    </GroupFilter>
                </Grid>

                <Grid item xs={4}>
                    <QuestionListManagement selectedTagIDs={selectedTagIDs} setCurrentQuestion={setCurrentQuestion}
                                            listQuestion={filteredQuestions}/>
                </Grid>

                <Grid item xs={5}>
                    <QuestionDetails currentQuestion={currentQuestion} updateQuestions={updateQuestions}/>
                </Grid>
            </Grid>
        </Box>
    );
}
